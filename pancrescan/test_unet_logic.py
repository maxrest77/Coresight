import os
import cv2
import torch
import numpy as np
from PIL import Image
from torchvision import transforms
import sys

sys.path.append(os.path.abspath("unet_pipeline"))
from model import TrueUNet
from dataset import auto_crop_roi_paired

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = TrueUNet()
model.load_state_dict(torch.load(r"c:\projects\CoreSight\pancrescan\unet_pipeline\true_unet_model.pth", map_location=device))
model.to(device)
model.eval()

preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def evaluate_image(filepath):
    print(f"--- Evaluating {os.path.basename(filepath)} ---")
    orig_img = cv2.imread(filepath)
    orig_img_rgb = cv2.cvtColor(orig_img, cv2.COLOR_BGR2RGB)
    
    fake_mask = np.zeros(orig_img.shape[:2], dtype=np.uint8)
    roi_img, _ = auto_crop_roi_paired(orig_img_rgb, fake_mask)
    
    pil_img = Image.fromarray(roi_img)
    input_tensor = preprocess(pil_img).unsqueeze(0).to(device)
    
    with torch.no_grad():
        out = model(input_tensor)
        pred_mask = torch.sigmoid(out).squeeze().cpu().numpy()
        
    max_conf = float(np.max(pred_mask))
    mean_conf = float(np.mean(pred_mask))
    
    binary_mask = (pred_mask > 0.30).astype(np.uint8) * 255
    binary_mask_resized = cv2.resize(binary_mask, (roi_img.shape[1], roi_img.shape[0]), interpolation=cv2.INTER_NEAREST)
    
    contours, _ = cv2.findContours(binary_mask_resized, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    total_pixels = binary_mask_resized.shape[0] * binary_mask_resized.shape[1]
    mask_pixel_count = int(np.sum(binary_mask_resized > 0))
    mask_area_pct = (mask_pixel_count / total_pixels) * 100.0
    
    print(f"Max Confidence: {max_conf:.4f}")
    print(f"Mean Confidence: {mean_conf:.4f}")
    print(f"Mask Area Pct (>0.30 threshold): {mask_area_pct:.2f}%")
    print(f"Contours Found: {len(contours)}")
    print("-" * 40)

if os.path.exists(r"c:\projects\CoreSight\DATASET\train\train\normal\1-001.jpg"):
    evaluate_image(r"c:\projects\CoreSight\DATASET\train\train\normal\1-001.jpg")
if os.path.exists(r"c:\projects\CoreSight\DATASET\train\train\pancreatic_tumor\1-045.jpg"):
    evaluate_image(r"c:\projects\CoreSight\DATASET\train\train\pancreatic_tumor\1-045.jpg")
