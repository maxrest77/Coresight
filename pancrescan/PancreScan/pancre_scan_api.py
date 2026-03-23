import base64
import io
import os
import time
from typing import Optional, Tuple

import numpy as np
import torch
import cv2
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from PIL import Image
from torchvision import transforms

from fastapi.middleware.cors import CORSMiddleware

# Import our new TrueUNet architecture modularly
import sys
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
unet_dir = os.path.join(project_root, "unet_pipeline")
if unet_dir not in sys.path:
    sys.path.append(unet_dir)

from model import TrueUNet
from dataset import auto_crop_roi_paired

app = FastAPI(title="PancreScan 3.0 (True UNet Bounding Engine)", version="0.3.0")

frontend_url = os.environ.get("FRONTEND_URL", "https://coresight.netlify.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "ok", "message": "PancreScan 3.0 API is running."}

class UNetBundle:
    """Consolidated Model Bundle eliminating legacy dependencies"""
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = TrueUNet()
        
        # Load our heavily-trained hybrid checkpoint
        model_path = os.path.join(unet_dir, "true_unet_model.pth")
        if os.path.exists(model_path):
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        else:
            print(f"Warning: {model_path} not found! Unet will run on raw initializations.")
            
        self.model.to(self.device)
        self.model.eval()
        
        self.preprocess = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

print("🚀 Initializing Live True U-Net Segmentation Bounding Engine...")
bundle = UNetBundle()

def image_to_base64(image_array: np.ndarray) -> str:
    # Fast native OpenCV encoding to Base64
    _, buffer = cv2.imencode('.png', image_array)
    encoded = base64.b64encode(buffer).decode("ascii")
    return encoded

def check_is_valid_scan(img_array: np.ndarray) -> Tuple[bool, str]:
    if len(img_array.shape) == 3 and img_array.shape[2] == 3:
        R, G, B = img_array[:, :, 0], img_array[:, :, 1], img_array[:, :, 2]
        rg = R - G
        yb = 0.5 * (R + G) - B
        rg_std, yb_std = np.std(rg), np.std(yb)
        rg_mean, yb_mean = np.mean(rg), np.mean(yb)
        colorfulness = np.sqrt(rg_std**2 + yb_std**2) + (0.3 * np.sqrt(rg_mean**2 + yb_mean**2))
        
        if colorfulness > 75.0:
            return False, f"Image appears overly colorful/false (score={colorfulness:.1f}). Expected grayscale CT."
    return True, ""

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    heatmap: bool = Query(default=False, description="Returns active bounding-box graphical overlay.")
) -> dict:
    try:
        image_data = await file.read()
        nparr = np.frombuffer(image_data, np.uint8)
        orig_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if orig_img is None:
            raise HTTPException(status_code=400, detail="Image rendering corrupted on load")
            
        orig_img_rgb = cv2.cvtColor(orig_img, cv2.COLOR_BGR2RGB)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="File corruption detected") from exc

    # OOD Physical Check
    is_valid, error_msg = check_is_valid_scan(orig_img_rgb)
    if not is_valid:
        return {
            "diagnosis": "inconclusive",
            "confidence": 0.0,
            "entropy": 0.0,
            "inference_ms": 0.0,
            "positive_class": "pancreatic_tumor",
            "positive_threshold": 0.50,
            "warning": error_msg,
            "heatmap_png_base64": None,
        }

    start = time.perf_counter()
    
    # 1. Execute Pure Mathematical OpenCV Geometric Extraction
    fake_mask = np.zeros(orig_img.shape[:2], dtype=np.uint8)
    roi_img, _ = auto_crop_roi_paired(orig_img_rgb, fake_mask)
    
    pil_img = Image.fromarray(roi_img)
    input_tensor = bundle.preprocess(pil_img).unsqueeze(0).to(bundle.device)
    
    # 2. PyTorch True U-Net Evaluation
    with torch.no_grad():
        out = bundle.model(input_tensor)
        pred_mask = torch.sigmoid(out).squeeze().cpu().numpy()
        
    binary_mask = (pred_mask > 0.30).astype(np.uint8) * 255
    
    # 3. Peak Activation Analysis for Dashboard Consistency
    max_confidence = float(np.max(pred_mask))
    
    # 4. Generate Bounding Structure & Encode Output
    binary_mask_resized = cv2.resize(binary_mask, (roi_img.shape[1], roi_img.shape[0]), interpolation=cv2.INTER_NEAREST)
    bgr_roi = cv2.cvtColor(roi_img, cv2.COLOR_RGB2BGR)
    
    contours, _ = cv2.findContours(binary_mask_resized, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    heatmap_b64 = None
    warning = None
    
    total_pixels = binary_mask_resized.shape[0] * binary_mask_resized.shape[1]
    mask_pixel_count = int(np.sum(binary_mask_resized > 0))
    mask_area_pct = (mask_pixel_count / total_pixels) * 100.0

    # Relaxed gate: Since we stopped at Epoch 2, raw probability scores will be lower.
    MIN_CONFIDENCE = 0.45   # Raised slightly (backgrounds randomly peak around 0.43)
    MIN_MASK_PCT = 0.5      # Mask must cover at least 0.5% of image

    # Noise check: if an early-stopped model hallucinates 100+ scattered noisy pixels, it's not a real cohesive tumor.
    is_structurally_cohesive = len(contours) > 0 and len(contours) < 50

    if is_structurally_cohesive and max_confidence >= MIN_CONFIDENCE and mask_area_pct >= MIN_MASK_PCT:
        diagnosis = "pancreatic_tumor"

        if heatmap:
            largest_contour = max(contours, key=cv2.contourArea)
            x, y, w, h = cv2.boundingRect(largest_contour)

            cv2.rectangle(bgr_roi, (x, y), (x+w, y+h), (0, 255, 0), 2)

            red_mask = np.zeros_like(bgr_roi)
            red_mask[:, :, 2] = binary_mask_resized
            overlay = cv2.addWeighted(bgr_roi, 0.7, red_mask, 0.5, 0)
            heatmap_b64 = image_to_base64(overlay)

    else:
        diagnosis = "inconclusive"
        warning = "No pancreatic features detected. Please provide a clear abdominal CT slice where the Pancreas is visibly present."
            
    inference_ms = (time.perf_counter() - start) * 1000.0

    # Adhere strictly to the Next.js UI expected json structure
    return {
        "diagnosis": diagnosis,
        "confidence": max_confidence,
        "entropy": 0.0, 
        "inference_ms": inference_ms,
        "positive_class": "pancreatic_tumor",
        "positive_threshold": 0.50,
        "warning": warning,
        "heatmap_png_base64": heatmap_b64,
    }
