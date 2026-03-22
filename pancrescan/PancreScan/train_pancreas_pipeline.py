import os
import re
import cv2
import time
import math
import numpy as np
from pathlib import Path
from PIL import Image

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision import transforms, models

# ==========================================
# 1. DATA LOADING & PREPROCESSING
# ==========================================

def is_valid_slice(filename, class_type):
    """
    Filters out irrelevant slices (Chest, Pelvis, etc.) based on user rules.
    Tumor slices range: 43 to 55
    Normal slices range: 40 to 52
    """
    # Assumes filename format like "1-045.jpg" or "patient_01-045.jpg"
    match = re.search(r'-0*(\d+)\.jpg$', filename.lower())
    if not match:
        return False
    
    slice_num = int(match.group(1))
    
    if class_type == "pancreatic_tumor":
        return 43 <= slice_num <= 55
    elif class_type == "normal":
        return 40 <= slice_num <= 52
    return False

class PancreasSliceDataset(Dataset):
    def __init__(self, root_dir, transform=None):
        """
        root_dir: e.g., 'c:/projects/CoreSight/DATASET/train/train'
        Expected structure:
          root_dir/
            pancreatic_tumor/
            normal/
        """
        self.root_dir = Path(root_dir)
        self.transform = transform
        self.samples = []
        
        # Load and filter Tumor images
        tumor_dir = self.root_dir / "pancreatic_tumor"
        if tumor_dir.exists():
            for f in tumor_dir.iterdir():
                if f.is_file() and is_valid_slice(f.name, "pancreatic_tumor"):
                    self.samples.append((str(f), 1)) # 1 = Tumor
                    
        # Load and filter Normal images
        normal_dir = self.root_dir / "normal"
        if normal_dir.exists():
            for f in normal_dir.iterdir():
                if f.is_file() and is_valid_slice(f.name, "normal"):
                    self.samples.append((str(f), 0)) # 0 = Normal
                    
        # Basic balancing logic (oversample the minority class if needed)
        self._balance_dataset()

    def _balance_dataset(self):
        tumors = [s for s in self.samples if s[1] == 1]
        normals = [s for s in self.samples if s[1] == 0]
        
        if not tumors or not normals:
             return
             
        diff = len(tumors) - len(normals)
        if diff > 0:
            # Oversample normals
            self.samples.extend(normals * (diff // len(normals)) + normals[:diff % len(normals)])
        elif diff < 0:
            diff = abs(diff)
            # Oversample tumors
            self.samples.extend(tumors * (diff // len(tumors)) + tumors[:diff % len(tumors)])

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        image = Image.open(img_path).convert("RGB")
        
        if self.transform:
            image = self.transform(image)
            
        return image, torch.tensor(label, dtype=torch.float32)

def get_dataloaders(root_dir, batch_size=16):
    train_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15), # Augmentation
        transforms.ColorJitter(contrast=0.2, brightness=0.2), # Augmentation
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    full_dataset = PancreasSliceDataset(root_dir, transform=train_transforms)
    
    if len(full_dataset) == 0:
        raise ValueError("No valid slices found. Check your dataset path and slice range rules.")
        
    # 80-20 Train/Validation Split
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])
    
    # Override transform for validation dataset
    val_dataset.dataset.transform = val_transforms
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    
    return train_loader, val_loader

# ==========================================
# 2. MODEL ARCHITECTURE
# ==========================================

class PancreasClassifier(nn.Module):
    def __init__(self, dropout_rate=0.5):
        super(PancreasClassifier, self).__init__()
        # Use pretrained ResNet18 as the backbone for robust feature extraction Feature mapping
        self.backbone = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
        
        # Replace the final fully connected layer
        num_ftrs = self.backbone.fc.in_features
        # Add regularization (Dropout) to prevent overfitting
        self.backbone.fc = nn.Sequential(
            nn.Dropout(dropout_rate),
            nn.Linear(num_ftrs, 1) # Output 1 logit for Binary Classification (BCEWithLogitsLoss)
        )

    def forward(self, x):
        return self.backbone(x)
        
    def get_cam_features(self, x):
        """Used for visualization (Grad-CAM)"""
        # Extract features from the last convolutional layer (layer4)
        features = None
        def hook(module, input, output):
            nonlocal features
            features = output
            
        handle = self.backbone.layer4.register_forward_hook(hook)
        out = self.backbone(x)
        handle.remove()
        return features, out

# ==========================================
# 3. TRAINING PIPELINE & VALIDATION
# ==========================================

def train_model(root_dir, epochs=20, lr=1e-4, device=None):
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
    train_loader, val_loader = get_dataloaders(root_dir)
    model = PancreasClassifier().to(device)
    
    # Proper Loss Function (BCE with Logits for stable binary classification)
    criterion = nn.BCEWithLogitsLoss()
    # Optimizer with Weight Decay (L2 Regularization)
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    
    best_val_loss = float('inf')
    patience = 5  # Early Stopping
    patience_counter = 0
    
    print(f"Starting training on {device}...")
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device).unsqueeze(1)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
            predictions = (torch.sigmoid(outputs) >= 0.5).float()
            correct += (predictions == labels).sum().item()
            total += labels.size(0)
            
        epoch_loss = running_loss / total
        epoch_acc = correct / total
        
        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device).unsqueeze(1)
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item() * inputs.size(0)
                predictions = (torch.sigmoid(outputs) >= 0.5).float()
                val_correct += (predictions == labels).sum().item()
                val_total += labels.size(0)
                
        val_epoch_loss = val_loss / val_total
        val_epoch_acc = val_correct / val_total
        
        print(f"Epoch {epoch+1}/{epochs} | "
              f"Train Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f} | "
              f"Val Loss: {val_epoch_loss:.4f} Acc: {val_epoch_acc:.4f}")
              
        # Early Stopping Logic & Model Saving
        if val_epoch_loss < best_val_loss:
            best_val_loss = val_epoch_loss
            patience_counter = 0
            torch.save(model.state_dict(), "best_pancreas_model.pth")
            print(" -> Saved Best Model")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print("Early stopping triggered due to no improvement.")
                break

    return model

# ==========================================
# 4. INFERENCE & VISUALIZATION (GRAD-CAM)
# ==========================================

def run_inference(image_path, model_path="best_pancreas_model.pth", device=None):
    """
    Inference ready for integration with FastAPI.
    Takes an image, returns diagnosis, confidence, and a heatmap numpy array.
    """
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
    model = PancreasClassifier()
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()
    
    # Load Image
    orig_img = cv2.imread(image_path)
    if orig_img is None:
        raise ValueError("Could not read image.")
    
    orig_img_rgb = cv2.cvtColor(orig_img, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(orig_img_rgb)
    
    preprocess = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    input_tensor = preprocess(pil_img).unsqueeze(0).to(device)
    
    # Make Prediction and run Grad-CAM
    features, out = model.get_cam_features(input_tensor)
    
    # We want gradients of the output logit with respect to the feature map
    features.retain_grad()
    
    confidence = torch.sigmoid(out).item()
    diagnosis = "Pancreatic Tumor Detected" if confidence >= 0.50 else "Normal (Healthy)"
    
    # Grad-CAM logic to highlight tumor region
    model.zero_grad()
    out.backward()
    
    gradients = features.grad
    if gradients is not None:
        pooled_gradients = torch.mean(gradients, dim=[0, 2, 3])
        for i in range(features.shape[1]):
            features[:, i, :, :] *= pooled_gradients[i]
            
    heatmap = torch.mean(features, dim=1).squeeze()
    heatmap = nn.ReLU()(heatmap) # ReLU on the heatmap
    heatmap /= torch.max(heatmap) # Normalize
    
    heatmap = heatmap.cpu().detach().numpy()
    heatmap = cv2.resize(heatmap, (orig_img.shape[1], orig_img.shape[0]))
    heatmap = np.uint8(255 * heatmap)
    
    # Create Visual Overlay
    colormap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(orig_img, 0.6, colormap, 0.4, 0)
    
    return diagnosis, confidence * 100, overlay

if __name__ == "__main__":
    # Train the model
    train_dir = r"c:\projects\CoreSight\DATASET\train\train"
    print(f"Loading dataset from: {train_dir}")
    train_model(train_dir, epochs=20, lr=1e-4)
    # test_img = r"c:\projects\CoreSight\DATASET\train\train\pancreatic_tumor\1-045.jpg"
    # diagnosis, score, heatmap_img = run_inference(test_img)
    # print(f"{diagnosis} | Confidence: {score:.1f}%")
    # cv2.imwrite("tumor_heatmap_visualization.jpg", heatmap_img)
    pass
