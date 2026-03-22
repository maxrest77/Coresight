import os
import torch
import torch.nn as nn
import torch.optim as optim
from dataset import get_dataloaders
from model import ResNetAttentionClassifier

def train_attention_model(root_dir, epochs=30, lr=1e-4, device=None):
    """
    Trains the ResNet18 + Spatial Attention Model using advanced schedulers.
    """
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
    train_loader, val_loader = get_dataloaders(root_dir)
    model = ResNetAttentionClassifier().to(device)
    
    # Pure BCE loss for binary tasks (since ground-truth masks are missing, we use Grad-CAM for localization)
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4) # L2 Regularization
    
    # Using a reducing scheduler per user-specs
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', patience=3, factor=0.5)
    
    best_val_loss = float('inf')
    patience = 7
    patience_counter = 0
    
    print(f"Starting Region-Focused Training on {device}...\n")
    for epoch in range(epochs):
        model.train()
        running_loss, correct, total = 0.0, 0, 0
        
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
        
        # Validation Loop
        model.eval()
        val_loss, val_correct, val_total = 0.0, 0, 0
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
        
        scheduler.step(val_epoch_loss)
        
        print(f"Epoch {epoch+1}/{epochs} | Train Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f} | Val Loss: {val_epoch_loss:.4f} Acc: {val_epoch_acc:.4f}")
              
        if val_epoch_loss < best_val_loss:
            best_val_loss = val_epoch_loss
            patience_counter = 0
            torch.save(model.state_dict(), "attention_model.pth")
            print(" -> Saved Best Model")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print("Early stopping invoked!")
                break
                
    return model

if __name__ == "__main__":
    train_dir = r"c:\projects\CoreSight\DATASET\train\train"
    print(f"Training on dataset: {train_dir}")
    train_attention_model(train_dir)
