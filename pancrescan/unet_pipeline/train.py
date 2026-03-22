import torch
import torch.nn as nn
import torch.optim as optim
from dataset import get_unet_dataloaders
from model import TrueUNet

class DiceBCELoss(nn.Module):
    """
    Hybrid Loss Function tailored specifically for Medical Segmentation.
    Leverages CrossEntropy to grade the raw logit scores computationally and applies 
    mathematical Intersection over Union (IoU / Dice) gradients to perfect the structural boundary outlines.
    """
    def __init__(self, smooth=1.0):
        super(DiceBCELoss, self).__init__()
        self.bce = nn.BCEWithLogitsLoss()
        self.smooth = smooth

    def forward(self, inputs, targets):
        # 1. Pixel-wise Classification Entropy
        bce_loss = self.bce(inputs, targets)
        
        # 2. Structural Dice IoU Metric
        inputs = torch.sigmoid(inputs)
        inputs = inputs.view(-1)
        targets = targets.view(-1)
        
        intersection = (inputs * targets).sum()
        dice_loss = 1.0 - (2.0 * intersection + self.smooth) / (inputs.sum() + targets.sum() + self.smooth)
        
        return bce_loss + dice_loss

def train_unet_model(root_dir, epochs=30, lr=1e-4, device=None):
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
    train_loader, val_loader = get_unet_dataloaders(root_dir)
    model = TrueUNet().to(device)
    
    criterion = DiceBCELoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', patience=3, factor=0.5)
    
    best_val_loss = float('inf')
    patience = 7
    patience_counter = 0
    
    print(f"Starting True UNet Segmentation Training Pipeline on {device}...")
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        for inputs, masks in train_loader:
            inputs, masks = inputs.to(device), masks.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, masks)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
            
        epoch_loss = running_loss / len(train_loader.dataset)
        
        # Validation Eval
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for inputs, masks in val_loader:
                inputs, masks = inputs.to(device), masks.to(device)
                outputs = model(inputs)
                loss = criterion(outputs, masks)
                val_loss += loss.item() * inputs.size(0)
                
        val_epoch_loss = val_loss / len(val_loader.dataset)
        scheduler.step(val_epoch_loss)
        
        print(f"Epoch {epoch+1}/{epochs} | Train Loss: {epoch_loss:.4f} | Val Loss: {val_epoch_loss:.4f}")
              
        if val_epoch_loss < best_val_loss:
            best_val_loss = val_epoch_loss
            patience_counter = 0
            torch.save(model.state_dict(), "true_unet_model.pth")
            print(" -> Checkpointed Mathematical Best UNet Model Weights")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print("Early stopping invoked due to plateauing validation metric!")
                break
                
    return model

if __name__ == "__main__":
    train_dir = r"c:\projects\CoreSight\pancrescan\data"
    train_unet_model(train_dir)
