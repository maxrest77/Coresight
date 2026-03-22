import os
import re
import cv2
import torch
import numpy as np
from pathlib import Path
from PIL import Image
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision import transforms

def auto_crop_roi(image_array):
    """
    Takes a BGR/RGB numpy array. Grayscales, thresholds, and crops to the central abdominal ROI.
    """
    gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
    # Threshold to remove black background (intensity < 15 is background)
    _, thresh = cv2.threshold(gray, 15, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return image_array # Fallback
        
    # Find largest contour (the body mass)
    largest_contour = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest_contour)
    
    # We crop specifically to the body mass bounding box
    cropped = image_array[y:y+h, x:x+w]
    return cropped

def is_valid_slice(filename, class_type):
    """Filters irrelevant slices"""
    match = re.search(r'-0*(\d+)\.jpg$', filename.lower())
    if not match: return False
    slice_num = int(match.group(1))
    # Rules mapped exactly to pancreas-relevant slices
    if class_type == "pancreatic_tumor": return 43 <= slice_num <= 55
    elif class_type == "normal": return 40 <= slice_num <= 52
    return False

class ROI_PancreasDataset(Dataset):
    def __init__(self, root_dir, transform=None):
        self.root_dir = Path(root_dir)
        self.transform = transform
        self.samples = []
        
        tumor_dir = self.root_dir / "pancreatic_tumor"
        if tumor_dir.exists():
            for f in tumor_dir.iterdir():
                if f.is_file() and is_valid_slice(f.name, "pancreatic_tumor"):
                    self.samples.append((str(f), 1)) # 1 = Tumor
                    
        normal_dir = self.root_dir / "normal"
        if normal_dir.exists():
            for f in normal_dir.iterdir():
                if f.is_file() and is_valid_slice(f.name, "normal"):
                    self.samples.append((str(f), 0)) # 0 = Normal
                    
        self._balance()

    def _balance(self):
        """Oversample minority class for perfectly balanced BCE batches."""
        tumors = [s for s in self.samples if s[1] == 1]
        normals = [s for s in self.samples if s[1] == 0]
        if not tumors or not normals: return
        diff = len(tumors) - len(normals)
        if diff > 0: self.samples.extend(normals * (diff // len(normals)) + normals[:diff % len(normals)])
        elif diff < 0:
            diff = abs(diff)
            self.samples.extend(tumors * (diff // len(tumors)) + tumors[:diff % len(tumors)])

    def __len__(self): return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        image = cv2.imread(img_path)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # 1. Automatic ROI Cropping (Isolates center abdominal ROI)
        roi_image = auto_crop_roi(image)
        pil_img = Image.fromarray(roi_image)
        
        if self.transform:
            pil_img = self.transform(pil_img)
            
        # 2. Advanced Gaussian Noise Augmentation 
        noise_level = 0.05
        noise = torch.randn_like(pil_img) * noise_level
        pil_img = pil_img + noise
        pil_img = torch.clamp(pil_img, 0., 1.)
        
        return pil_img, torch.tensor(label, dtype=torch.float32)

def get_dataloaders(root_dir, batch_size=16):
    train_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),  # ±15 degrees rotation
        transforms.ColorJitter(contrast=0.3, brightness=0.2), # Contrast adjustment
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    full_dataset = ROI_PancreasDataset(root_dir, transform=train_transforms)
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])
    
    # Validation uses non-augmented transforms
    val_dataset.dataset.transform = val_transforms
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    
    return train_loader, val_loader
