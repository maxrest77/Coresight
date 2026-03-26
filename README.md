# CoreSight

**AI-Powered Pancreatic Tumor Detection from Abdominal CT Scans**

CoreSight is a full-stack clinical web application that combines a modern Next.js medical dashboard with a PyTorch U-Net deep learning backend to perform real-time, pixel-precise pancreatic tumor segmentation from abdominal CT images.

---

## What It Does

A radiologist or clinician logs into the secure dashboard, navigates to the **Pancreas Scan** module, and uploads an abdominal CT scan slice. Within milliseconds, the AI backend:

1. Validates the scan is a legitimate grayscale CT (rejects photos and chest scans)
2. Automatically crops to the most relevant abdominal region
3. Runs the CT slice through a trained **True U-Net Segmentation Model**
4. Draws a precise **green bounding box** and **red pixel mask** over the detected tumor region
5. Returns a structured confidence-scored diagnosis back to the UI in real-time

---

## Tech Stack

### Frontend
| | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript + React 19 |
| Styling | TailwindCSS 4 |
| Components | Shadcn/UI + Radix UI |
| Animation | Framer Motion |
| Charts | Recharts |
| Auth & DB | Firebase (Authentication + Firestore) |
| Icons | Lucide React |
| Theme | next-themes (Dark/Light mode) |

### AI/ML Backend
| | Technology |
|---|---|
| Server | FastAPI + Uvicorn (Python 3.13) |
| Deep Learning | PyTorch + TorchVision |
| Model | True UNet (Encoder-Decoder with Skip Connections) |
| Loss Function | Hybrid DiceLoss + BCEWithLogitsLoss |
| Medical Imaging | nibabel (NIfTI .nii.gz reader) |
| Image Processing | OpenCV, Pillow, NumPy |
| Training Platform | Google Colab T4 GPU (~15 min) / CPU fallback |

---

## Dataset

- **Source**: Medical Segmentation Decathlon — Task07 Pancreas (Memorial Sloan Kettering)
- **Format**: 3D NIfTI volumetric CT scans (`.nii.gz`)
- **Patients Used**: 15 training patients extracted for initial training
- **Slices Extracted**: ~529 positive (pancreas visible) + 35 negative (background) 2D PNG pairs
- **Windowing**: Soft-tissue HU range (−100 to +240) for maximum anatomical clarity

---

## AI Pipeline

```
CT Upload → OOD Colorfulness Check → Auto ROI Crop → UNet Inference
    → Binary Thresholding (0.30) → Noise Filtering (< 50 contours)
    → Confidence Gate (≥ 0.45) → Area Gate (≥ 0.5% of image)
    → Green BBox + Red Mask Overlay → Base64 → React Dashboard
```

---

## Project Structure

```
CoreSight/
├── app/                      ← Next.js clinical dashboard pages
├── components/
│   └── pancreas/
│       └── SingleScanAnalysis.tsx ← Core CT upload + diagnosis component
├── pancrescan/
│   ├── PancreScan/
│   │   └── pancre_scan_api.py     ← FastAPI prediction endpoint
│   ├── unet_pipeline/
│   │   ├── model.py               ← TrueUNet architecture
│   │   ├── dataset.py             ← Paired DataLoader + ROI cropping
│   │   ├── train.py               ← DiceBCELoss training loop
│   │   ├── inference.py           ← Bounding box visualizer
│   │   └── true_unet_model.pth    ← Trained model weights
│   ├── Task07_Pancreas/           ← Raw NIfTI medical volumes
│   ├── data/images/ & masks/      ← Extracted 2D training pairs
│   ├── extract_task07_data.py     ← NIfTI → PNG extractor
│   └── Colab_UNet_Trainer.ipynb   ← Ready-to-run Google Colab GPU notebook
└── DATASET/                       ← Original pure-image patient dataset
```

---

## Running Locally

### Prerequisites
- Node.js 18+
- Python 3.11+
- `pip install fastapi uvicorn torch torchvision nibabel opencv-python pillow numpy tqdm`

### 1. Start the Frontend
```bash
npm run dev
# → http://localhost:3000
```

### 2. Start the AI Backend
```bash
cd pancrescan/PancreScan
uvicorn pancre_scan_api:app --port 8000
# → http://localhost:8000
```

---

## Retraining the Model

1. Add NIfTI volumes to `Task07_Pancreas/imagesTr/` and matching masks to `labelsTr/`
2. Run: `python extract_task07_data.py` to extract new 2D slices
3. Upload the `data/` folder + `Colab_UNet_Trainer.ipynb` to Google Colab
4. Set **Runtime → GPU (T4)** and run all cells (~15 minutes)
5. Download `true_unet_model.pth` → place in `pancrescan/unet_pipeline/`

---

##  Known Limitations & Current Problems

> This model is a **research prototype only** and is not production-ready. Below is an honest breakdown of its current weaknesses.

| # | Problem | Severity | Fix |
|---|---|---|---|
| 1 | Only **15 patients** trained (need 281) | 🔴 Critical | Full dataset extraction + Colab retraining |
| 2 | **Stopped at Epoch 2** — model is still in random-weight phase | 🔴 Critical | Full 30-epoch GPU training on Colab |
| 3 | **Pancreas and Tumor merged** — model can't tell them apart | 🔴 Critical | 2-channel UNet output or classification head |
| 4 | **15:1 class imbalance** — far more positives than negatives | 🟠 High | Balance dataset to 1:1 or 2:1 ratio |
| 5 | **Colorfulness OOD check** is a rough heuristic — can be fooled | 🟡 Medium | Train a dedicated CT/non-CT binary classifier |
| 6 | **No formal Dice benchmarking** — performance is unknown | 🟡 Medium | Run Dice IoU evaluation on held-out patients |
| 7 | **224×224 resolution limit** — misses micro-tumors | 🟡 Medium | Upgrade to 512px or sliding-window inference |

### Detail

**1. Dataset too small:** State-of-the-art pancreas segmentation models use 200+ patients. With only 15, the model memorizes those specific patients rather than learning general anatomy. The fix is simply running `extract_task07_data.py` on all 281 patients and retraining.

**2. Under-trained at Epoch 2:** At Epoch 2, a U-Net has barely started adjusting its weights. Its outputs are effectively educated noise. The full 30-epoch training loop on Google Colab GPU takes only ~15 minutes and would produce a genuinely capable model.

**3. Pancreas ≠ Tumor:** The NIfTI ground-truth labels have 3 classes: background (0), pancreas (1), and cancer (2). Our extractor collapses both 1 and 2 into a single "positive" class. The model therefore cannot distinguish a healthy pancreas from a cancerous one. A 2-channel output head is needed.

**4. Class imbalance:** 529 positive vs 35 negative examples means the model is biased approximately 15:1 toward predicting "something is there." This directly causes false positives on chest or kidney scans.

**5–7:** These are medium-priority issues that would improve robustness but are less critical than the first four.

---

## License
This project is developed as a clinical AI research application. For educational and research purposes only. Not certified for clinical use.
## Authors

Karthikeyan S  
Rangeshpandian P T  
Mutthuram S R

