import cv2
import torch
import numpy as np
from pathlib import Path
from PIL import Image
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision import transforms

def auto_crop_roi_paired(image_array, mask_array):
    """
    Spatially locates the abdominal mass via intensity thresholding, then crops 
    BOTH the image and the mask precisely to the exact same dimension.
    """
    gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
    _, thresh = cv2.threshold(gray, 15, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return image_array, mask_array
        
    largest_contour = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest_contour)
    
    cropped_img = image_array[y:y+h, x:x+w]
    cropped_mask = mask_array[y:y+h, x:x+w]
    return cropped_img, cropped_mask

class UNetPancreasDataset(Dataset):
    def __init__(self, root_dir, is_train=True):
        self.root_dir = Path(root_dir)
        self.img_dir = self.root_dir / "images"
        self.mask_dir = self.root_dir / "masks"
        self.is_train = is_train
        
        self.files = []
        if self.img_dir.exists():
            for f in self.img_dir.iterdir():
                if f.is_file() and f.suffix == '.png':
                    mask_path = self.mask_dir / f.name
                    if mask_path.exists():
                        self.files.append(f.name)

    def __len__(self): return len(self.files)

    def __getitem__(self, idx):
        fname = self.files[idx]
        img_path = str(self.img_dir / fname)
        mask_path = str(self.mask_dir / fname)
        
        image = cv2.imread(img_path)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
        
        # Perform dynamic dimensional restriction
        roi_img, roi_mask = auto_crop_roi_paired(image, mask)
        
        roi_img = cv2.resize(roi_img, (224, 224))
        # Masks must use NEAREST interpolation to prevent pixel blurring (0.5 values)
        roi_mask = cv2.resize(roi_mask, (224, 224), interpolation=cv2.INTER_NEAREST)
        
        pil_img = Image.fromarray(roi_img)
        pil_mask = Image.fromarray(roi_mask)
        
        # Synchronous transforms (Data Augmentation)
        if self.is_train and np.random.rand() > 0.5:
            pil_img = transforms.functional.hflip(pil_img)
            pil_mask = transforms.functional.hflip(pil_mask)
            
        img_tensor = transforms.ToTensor()(pil_img)
        img_tensor = transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])(img_tensor)
        
        # Normalize binary mask mathematically to float boundaries (0.0 to 1.0)
        mask_tensor = torch.from_numpy(np.array(pil_mask)).float() / 255.0
        mask_tensor = mask_tensor.unsqueeze(0) # [1, 224, 224]
        
        return img_tensor, mask_tensor

def get_unet_dataloaders(root_dir, batch_size=8):
    full_dataset = UNetPancreasDataset(root_dir, is_train=True)
    if len(full_dataset) == 0:
        raise ValueError("No images/masks found! Run the NIfTI extractor script first!")
        
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])
    
    # Disable augmentations for Val dataset safely
    val_dataset.dataset.is_train = False
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    return train_loader, val_loader
