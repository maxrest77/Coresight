import os
import cv2
import torch
import torch.nn as nn
import numpy as np
from PIL import Image
from torchvision import transforms
from model import ResNetAttentionClassifier
from dataset import auto_crop_roi

def run_inference(image_path, model_path="attention_model.pth", device=None):
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
    model = ResNetAttentionClassifier()
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location=device))
    else:
        print("Warning: attention_model.pth not found, using untrained weights.")
        
    model.to(device)
    model.eval()
    
    orig_img = cv2.imread(image_path)
    if orig_img is None: raise ValueError("Could not read image.")
    orig_img_rgb = cv2.cvtColor(orig_img, cv2.COLOR_BGR2RGB)
    
    # STRICT ROI CROPPING: Generates tight frame over abdominal mass
    roi_img = auto_crop_roi(orig_img_rgb)
    pil_img = Image.fromarray(roi_img)
    
    preprocess = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    input_tensor = preprocess(pil_img).unsqueeze(0).to(device)
    
    # Inference hook on the Spatial Attention mapped layers!
    features, out = model.get_cam_features(input_tensor)
    features.retain_grad()
    
    confidence = torch.sigmoid(out).item()
    diagnosis = "Pancreatic Tumor Detected" if confidence >= 0.50 else "Normal (Healthy)"
    
    model.zero_grad()
    out.backward()
    
    gradients = features.grad
    if gradients is not None:
        # -----------------------------
        # Grad-CAM++ Mathematics targeting the ROI
        # -----------------------------
        gradients_power_2 = gradients ** 2
        gradients_power_3 = gradients_power_2 * gradients
        sum_activations = torch.sum(features, dim=(2, 3), keepdim=True)
        eps = 1e-7
        
        aij = gradients_power_2 / (2 * gradients_power_2 + sum_activations * gradients_power_3 + eps)
        aij = torch.where(gradients != 0, aij, torch.zeros_like(aij))
        
        weights = torch.sum(aij * nn.ReLU()(gradients), dim=(2, 3), keepdim=True)
        cam = torch.sum(weights * features, dim=1, keepdim=True)
    else:
        cam = torch.mean(features, dim=1, keepdim=True)
        
    # Heatmap normalization
    heatmap = nn.ReLU()(cam).squeeze()
    heatmap /= (torch.max(heatmap) + 1e-8)
    
    heatmap = heatmap.cpu().detach().numpy()
    # Map directly onto the constrained ROI, ignoring black space!
    heatmap_resized = cv2.resize(heatmap, (roi_img.shape[1], roi_img.shape[0]))
    heatmap_uint8 = np.uint8(255 * heatmap_resized)
    
    colormap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(cv2.cvtColor(roi_img, cv2.COLOR_RGB2BGR), 0.6, colormap, 0.4, 0)
    
    return diagnosis, confidence * 100, overlay

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        diag, conf, hm = run_inference(sys.argv[1])
        print(f"Prediction: {diag} ({conf:.1f}%)")
        cv2.imwrite("gradcam_plusplus_roi.jpg", hm)
        print("Exported tightly localized heatmap to 'gradcam_plusplus_roi.jpg'")
    else:
        print("Usage: python inference.py <path_to_image>")
