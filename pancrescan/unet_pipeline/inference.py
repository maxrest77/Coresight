import os
import cv2
import torch
import numpy as np
from PIL import Image
from torchvision import transforms
from model import TrueUNet
from dataset import auto_crop_roi_paired

def run_unet_inference(image_path, model_path="true_unet_model.pth", device=None):
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
    model = TrueUNet()
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location=device))
    else:
        print("Warning: Model weights not found, using untrained backbone for demonstration...")
        
    model.to(device)
    model.eval()
    
    orig_img = cv2.imread(image_path)
    if orig_img is None: 
        raise ValueError("Could not read inference image.")
        
    orig_img_rgb = cv2.cvtColor(orig_img, cv2.COLOR_BGR2RGB)
    
    # Fake mask just allows us to use the secure paired function without errors
    fake_mask = np.zeros(orig_img.shape[:2], dtype=np.uint8)
    roi_img, _ = auto_crop_roi_paired(orig_img_rgb, fake_mask)
    
    pil_img = Image.fromarray(roi_img)
    preprocess = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    input_tensor = preprocess(pil_img).unsqueeze(0).to(device)
    
    # ---------------------------------------------
    # Direct Semantic Structural Extraction (UNet)
    # ---------------------------------------------
    with torch.no_grad():
        out = model(input_tensor)
        pred_mask = torch.sigmoid(out).squeeze().cpu().numpy()
        
    # Snap float probabilities back into standard binary graphical masks (Threshold > 0.5)
    binary_mask = (pred_mask > 0.5).astype(np.uint8) * 255
    
    # Stretch boundary back geometrically over original abdominal rectangle bounds using Nearest mode
    binary_mask_resized = cv2.resize(binary_mask, (roi_img.shape[1], roi_img.shape[0]), interpolation=cv2.INTER_NEAREST)
    bgr_roi = cv2.cvtColor(roi_img, cv2.COLOR_RGB2BGR)
    
    # Open CV Shape Recognition to extract mathematical Bounding Box array
    contours, _ = cv2.findContours(binary_mask_resized, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if contours:
        # Wrap the largest unified blob boundary predicted by the UNet
        largest_contour = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(largest_contour)
        
        # Draw physical bright-green vector box on frame
        cv2.rectangle(bgr_roi, (x, y), (x+w, y+h), (0, 255, 0), 2)
        diagnosis = "Pancreatic Region Isolated & Identified"
    else:
        diagnosis = "No confident anatomical region detected."
    
    # Generate Physical Transluscent Red Semantic Pixel Mask Overlay
    red_mask = np.zeros_like(bgr_roi)
    red_mask[:, :, 2] = binary_mask_resized 
    
    final_output = cv2.addWeighted(bgr_roi, 0.7, red_mask, 0.5, 0)
    
    return diagnosis, final_output

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        diag, graphic = run_unet_inference(sys.argv[1])
        print(f"Engine Log: {diag}")
        out_name = "unet_bounding_box_extraction.jpg"
        cv2.imwrite(out_name, graphic)
        print(f"Exported pixel-perfect bounding box extraction to: '{out_name}'")
    else:
        print("Usage: python inference.py <path_to_CT_slice>")
