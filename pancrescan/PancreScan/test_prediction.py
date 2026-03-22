import sys
import cv2
import warnings
warnings.filterwarnings("ignore")
from train_pancreas_pipeline import run_inference

if len(sys.argv) < 2:
    print("Please provide an image path. Usage: python test_prediction.py <image_path>")
    sys.exit(1)
    
img_path = sys.argv[1]
print(f"Running Pure Dataset ResNet18 Model on: {img_path}")

try:
    diagnosis, confidence, heatmap = run_inference(img_path, "best_pancreas_model.pth")
    print(f"\n--- PREDICTION ---")
    print(f"Diagnosis: {diagnosis}")
    print(f"Confidence: {confidence:.2f}%")

    out_path = r"C:\Users\karth\.gemini\antigravity\brain\79dea6ad-0033-4dde-8eb7-880dcbdcdf45\cnn_heatmap_result.jpg"
    cv2.imwrite(out_path, heatmap)
    print(f"------------------")
    print(f"\nHeatmap visualization saved to artifacts: {out_path}")

except Exception as e:
    print(f"Error during inference: {e}")
