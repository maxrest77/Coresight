# Unified PancreScan Predictor - Quick Start Guide

## Overview

The **Unified Predictor** chains segmentation (UNet) → classification (Ensemble) for end-to-end pancreatic cancer detection in a single pipeline.

```
Image → Segmentation (UNet) → Tumor Mask → Classification (Ensemble) → Disease Probability
         ↓                                   ↓
      Tumor Area %                    Final Diagnosis
```

## Installation

Make sure required packages are installed:
```bash
pip install torch torchvision
```

## Basic Usage

### 1️⃣ Command Line - Single Image

```bash
python unified_predictor.py \
    --image data/images/sample.png \
    --seg-model model.pth \
    --classifiers densenet121,efficientnet_v2_s \
    --classifier-paths PancreScan/outputs/densenet121_best.pt,PancreScan/outputs/demo_models/efficientnet_v2_s_fold_1_best.pt \
    --ensemble-weights 0.5,0.5 \
    --visualize
```

### 2️⃣ Command Line - Batch Processing

```bash
python unified_predictor.py \
    --image-dir data/images/ \
    --seg-model model.pth \
    --classifiers densenet121,efficientnet_v2_s \
    --classifier-paths PancreScan/outputs/densenet121_best.pt,PancreScan/outputs/demo_models/efficientnet_v2_s_fold_1_best.pt \
    --visualize
```

### 3️⃣ Python API - Programmatic Usage

```python
from unified_predictor import PancreScanPredictor

# Initialize
predictor = PancreScanPredictor(
    seg_model_path="model.pth",
    classifier_names=["densenet121", "efficientnet_v2_s"],
    classifier_paths=[
        "PancreScan/outputs/densenet121_best.pt",
        "PancreScan/outputs/demo_models/efficientnet_v2_s_fold_1_best.pt",
    ],
    ensemble_weights=[0.5, 0.5],
    device="auto"  # auto, cuda, or cpu
)

# Single prediction
result = predictor.predict("data/images/sample.png", visualize=True)

# Access results
print(f"Disease Probability: {result.disease_probability:.2%}")
print(f"Tumor Area: {result.tumor_area_percentage:.2f}%")
print(f"Predicted: {'DISEASE' if result.predicted_class == 1 else 'NORMAL'}")
```

## Output Structure

The `PredictionResult` object contains:

```python
@dataclass
class PredictionResult:
    segmentation_mask: np.ndarray          # Binary mask (0/1)
    segmentation_confidence: float         # Sigmoid output (0-1)
    tumor_area_percentage: float           # % of image showing tumor
    
    classification_logits: torch.Tensor    # Raw model outputs
    classification_probabilities: np.ndarray  # [P(normal), P(disease)]
    disease_probability: float             # P(disease) - PRIMARY RESULT
    predicted_class: int                   # 0=normal, 1=disease
    
    ensemble_weights: List[float]          # Model weights
    image_shape: Tuple[int, int]           # Input size
```

## Key Features

### ✅ Ensemble Models
Combines multiple architectures for robust predictions:
- DenseNet121
- EfficientNet-B0
- EfficientNet-V2-S
- ResNet50
- ConvNeXt-Tiny

### ✅ Automatic Device Selection
```python
predictor = PancreScanPredictor(device="auto")  # Uses GPU if available
```

### ✅ Batch Processing
```python
results = predictor.predict_batch("data/images/")
```

### ✅ Custom Ensemble Weights
```python
predictor = PancreScanPredictor(
    classifier_names=["densenet121", "efficientnet_v2_s", "convnext_tiny"],
    classifier_paths=["path1.pt", "path2.pt", "path3.pt"],
    ensemble_weights=[0.4, 0.4, 0.2]  # DenseNet & EfficientNet stronger
)
```

## Advanced Examples

### Decision with Custom Thresholds

```python
result = predictor.predict("image.png")

# More conservative threshold
disease_threshold = 0.6
area_threshold = 5.0  # Minimum tumor area

if result.disease_probability >= disease_threshold and \
   result.tumor_area_percentage >= area_threshold:
    decision = "POSITIVE"
else:
    decision = "NEGATIVE"
```

### Confidence Scoring

```python
result = predictor.predict("image.png")

# Weighted confidence
classification_conf = max(result.classification_probabilities)
segmentation_conf = result.segmentation_confidence

overall_confidence = (classification_conf * 0.7 + segmentation_conf * 0.3)
```

### Save Results to JSON

```python
import json

results = predictor.predict_batch("data/images/")

report = {
    "total_images": len(results),
    "positive_cases": sum(1 for r in results if r.predicted_class == 1),
    "predictions": [
        {
            "disease_probability": float(r.disease_probability),
            "tumor_area_percentage": float(r.tumor_area_percentage),
            "decision": "DISEASE" if r.predicted_class == 1 else "NORMAL"
        }
        for r in results
    ]
}

with open("predictions.json", "w") as f:
    json.dump(report, f, indent=2)
```

## Comparison: Single vs Ensemble

### Single Model
```python
predictor_single = PancreScanPredictor(
    classifier_names=["densenet121"],
    classifier_paths=["path/to/densenet121_best.pt"]
)
```

### Ensemble (Recommended)
```python
predictor_ensemble = PancreScanPredictor(
    classifier_names=["densenet121", "efficientnet_v2_s"],
    classifier_paths=["path1.pt", "path2.pt"],
    ensemble_weights=[0.5, 0.5]
)
```

**Ensemble advantages:**
- More robust predictions
- Better generalization
- Multiple perspectives on same image
- Reduced overfitting risk

## Performance Tips

### 1. Use GPU
```python
predictor = PancreScanPredictor(device="cuda")
```

### 2. Batch Processing
Processing 100 images at once is faster than one-by-one:
```python
results = predictor.predict_batch("image_dir/")
```

### 3. Reduce Ensemble Size
If speed is critical, use fewer models:
```python
predictor = PancreScanPredictor(
    classifier_names=["densenet121"],  # Single model
    classifier_paths=["path/to/model.pt"]
)
```

## Troubleshooting

### Model not found
```
FileNotFoundError: model.pth
```
**Solution:** Check file paths are correct and relative to script location.

### CUDA out of memory
```python
# Use CPU instead
predictor = PancreScanPredictor(device="cpu")
```

### Low disease probability with visible tumor
Check:
1. Image is loaded correctly (try with `visualize=True`)
2. Model was trained on similar image types
3. Tumor area might be below decision threshold

## Running Examples

See `examples_unified_predictor.py` for 7 complete examples:

```bash
python examples_unified_predictor.py
```

Examples include:
1. Single image prediction
2. Batch processing
3. Custom thresholds
4. JSON export
5. Single vs ensemble comparison
6. Different architectures
7. Confidence scoring

## API Reference

### `PancreScanPredictor.__init__`

```python
PancreScanPredictor(
    seg_model_path: str = "model.pth",
    classifier_names: Optional[List[str]] = None,
    classifier_paths: Optional[List[str]] = None,
    ensemble_weights: Optional[List[float]] = None,
    device: str = "auto",
    img_size: int = 256
)
```

### `PancreScanPredictor.predict`

```python
result: PredictionResult = predictor.predict(
    image_path: str,
    visualize: bool = False
)
```

### `PancreScanPredictor.predict_batch`

```python
results: List[PredictionResult] = predictor.predict_batch(
    image_dir: str,
    visualize: bool = False
)
```

## Notes

- **Default input size:** 256×256 pixels
- **Supported formats:** PNG, JPG (grayscale or RGB)
- **Output classes:** 0=Normal, 1=Disease
- **Probability range:** 0.0 to 1.0
- **Ensemble logit combination:** Weighted average

## Next Steps

1. **Run example:** `python examples_unified_predictor.py`
2. **Try single image:** `python unified_predictor.py --image data/images/sample.png --visualize`
3. **Batch process:** `python unified_predictor.py --image-dir data/images/`
4. **Integrate into app:** Use Python API in your application

---

**Questions?** Check the examples or docstrings in `unified_predictor.py`
