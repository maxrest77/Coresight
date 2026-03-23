# PancreScan Unified Predictor - Complete System

This document explains the integrated prediction system that chains **segmentation → classification** for end-to-end pancreatic cancer detection.

## 📁 Project Structure

```
pancrescan/
├── unified_predictor.py              # Main unified predictor class
├── config.py                         # Configuration presets
├── examples_unified_predictor.py     # 7 practical examples
├── UNIFIED_PREDICTOR_GUIDE.md        # Quick start guide
│
├── model.pth                         # UNet segmentation model
├── predict.py                        # Original segmentation script
│
├── PancreScan/
│   ├── outputs/
│   │   ├── densenet121_best.pt       # DenseNet classifier
│   │   └── demo_models/
│   │       └── efficientnet_v2_s_fold_1_best.pt  # EfficientNet classifier
│   │
│   ├── train_phase1_baseline.py      # Phase 1 baseline training
│   ├── train_ensemble_smart.py       # Ensemble training
│   └── run_kfold_cv.py               # K-fold validation
│
└── data/
    └── images/                       # Test images
```

## 🎯 What's New: Unified Pipeline

### ❌ Before (Disconnected)
```
Segmentation (predict.py) → Manual mask → Classification (separate models)
```
✗ Manual steps  
✗ Multiple files to maintain  
✗ No unified output  

### ✅ After (Unified)
```
Image → Unified Predictor → Segmentation → Classification → Report
                                ↓               ↓
                           Tumor Area      Disease Probability
```
✓ Single entry point  
✓ Automatic chaining  
✓ Structured output  
✓ Ensemble ready  

## 🚀 Quick Start

### Installation
```bash
pip install torch torchvision
```

### 1-Minute Example

```python
from unified_predictor import PancreScanPredictor

# Initialize
predictor = PancreScanPredictor(
    seg_model_path="model.pth",
    classifier_names=["densenet121", "efficientnet_v2_s"],
    classifier_paths=[
        "PancreScan/outputs/densenet121_best.pt",
        "PancreScan/outputs/demo_models/efficientnet_v2_s_fold_1_best.pt"
    ]
)

# Predict
result = predictor.predict("data/images/sample.png", visualize=True)

# Results
print(f"Disease Probability: {result.disease_probability:.2%}")
print(f"Tumor Area: {result.tumor_area_percentage:.2f}%")
print(f"Decision: {'🔴 DISEASE' if result.predicted_class == 1 else '🟢 NORMAL'}")
```

## 🔧 Configuration Presets

Use pre-built configurations for different scenarios:

```python
from config import get_gpu_config, get_fast_config, get_clinical_config
from unified_predictor import PancreScanPredictor

# GPU ensemble (balanced speed + accuracy)
config = get_gpu_config()

# Fast inference (single model)
config = get_fast_config()

# Clinical use (conservative thresholds)
config = get_clinical_config()

# Initialize with config
predictor = PancreScanPredictor(
    seg_model_path=config.seg_model_path,
    classifier_names=config.classifier_names,
    classifier_paths=config.classifier_paths,
    ensemble_weights=config.ensemble_weights,
    device=config.device
)
```

## 📊 Comparison: Integration Approach

| Aspect | Original | Unified |
|--------|----------|---------|
| **Entry Points** | 3 scripts | 1 script |
| **Configuration** | Multiple argparse | Single config object |
| **Segmentation** | Separate predict.py | Integrated |
| **Classification** | Pick architecture manually | Ensemble built-in |
| **Output Format** | Inconsistent | Structured dataclass |
| **Batch Processing** | Not supported | Native support |
| **API** | CLI only | Python + CLI |

## 🔄 Workflow Examples

### Example 1: Single Image with Custom Thresholds
```python
from unified_predictor import PancreScanPredictor

predictor = PancreScanPredictor()
result = predictor.predict("image.png")

# Custom decision logic
if result.disease_probability > 0.6 and result.tumor_area_percentage > 5.0:
    action = "REFER_TO_SPECIALIST"
else:
    action = "MONITOR"
```

### Example 2: Batch Processing with Report
```python
import json

predictor = PancreScanPredictor()
results = predictor.predict_batch("data/images/")

# Generate report
report = {
    "total": len(results),
    "positive": sum(1 for r in results if r.predicted_class == 1),
    "positive_rate": sum(r.predicted_class for r in results) / len(results),
    "images": [
        {
            "disease_prob": float(r.disease_probability),
            "tumor_area": float(r.tumor_area_percentage)
        }
        for r in results
    ]
}

with open("batch_report.json", "w") as f:
    json.dump(report, f, indent=2)
```

### Example 3: Compare Single vs Ensemble
```python
from unified_predictor import PancreScanPredictor

# Single model (fast)
p_single = PancreScanPredictor(
    classifier_names=["densenet121"],
    classifier_paths=["path/to/densenet121_best.pt"]
)

# Ensemble (accurate)
p_ensemble = PancreScanPredictor(
    classifier_names=["densenet121", "efficientnet_v2_s"],
    classifier_paths=["path1.pt", "path2.pt"],
    ensemble_weights=[0.5, 0.5]
)

result_single = p_single.predict("image.png")
result_ensemble = p_ensemble.predict("image.png")

print(f"Single: {result_single.disease_probability:.2%}")
print(f"Ensemble: {result_ensemble.disease_probability:.2%}")
```

## 📈 Output Structure

The unified predictor returns a structured `PredictionResult`:

```python
@dataclass
class PredictionResult:
    # Segmentation outputs
    segmentation_mask: np.ndarray              # Binary mask
    segmentation_confidence: float             # Model certainty
    tumor_area_percentage: float               # Size of tumor
    
    # Classification outputs
    classification_logits: torch.Tensor        # Raw scores
    classification_probabilities: np.ndarray   # Softmax [P(normal), P(disease)]
    disease_probability: float                 # PRIMARY METRIC
    predicted_class: int                       # 0 or 1
    
    # Metadata
    ensemble_weights: List[float]              # Model weights
    image_shape: Tuple[int, int]               # Input dimensions
```

## 🎛️ Supported Architectures

Base classifiers available:

| Architecture | Speed | Accuracy | Best For |
|--------------|-------|----------|----------|
| DenseNet121 | ⭐⭐ | ⭐⭐⭐ | Balanced |
| EfficientNet-B0 | ⭐⭐⭐ | ⭐⭐ | Fast inference |
| EfficientNet-V2-S | ⭐⭐⭐ | ⭐⭐⭐ | Modern, efficient |
| ResNet50 | ⭐⭐ | ⭐⭐⭐ | Classic baseline |
| ConvNeXt-Tiny | ⭐⭐⭐ | ⭐⭐⭐ | Vision Transformer style |

### Create Custom Ensemble
```python
predictor = PancreScanPredictor(
    classifier_names=["densenet121", "resnet50", "convnext_tiny"],
    classifier_paths=["model1.pt", "model2.pt", "model3.pt"],
    ensemble_weights=[0.4, 0.3, 0.3]
)
```

## 💻 Command Line Interface

```bash
# Single image with visualization
python unified_predictor.py \
    --image data/images/sample.png \
    --visualize

# Batch processing
python unified_predictor.py \
    --image-dir data/images/

# Custom models
python unified_predictor.py \
    --image data/images/sample.png \
    --classifiers densenet121,convnext_tiny \
    --classifier-paths model1.pt,model2.pt \
    --ensemble-weights 0.6,0.4 \
    --visualize

# GPU processing
python unified_predictor.py \
    --image-dir data/images/ \
    --device cuda
```

## 🔬 Running 7 Examples

Run all practical examples:

```bash
python examples_unified_predictor.py
```

Includes:
1. ✅ Single image prediction
2. ✅ Batch processing
3. ✅ Custom thresholds
4. ✅ JSON export
5. ✅ Single vs ensemble comparison
6. ✅ Different architectures
7. ✅ Confidence scoring

## 📖 Documentation

- **[UNIFIED_PREDICTOR_GUIDE.md](UNIFIED_PREDICTOR_GUIDE.md)** - Complete API reference
- **[unified_predictor.py](unified_predictor.py)** - Source code with docstrings
- **[config.py](config.py)** - Configuration system
- **[examples_unified_predictor.py](examples_unified_predictor.py)** - 7 practical examples

## 🎓 Learning Path

1. **Get Started** (5 min)
   - Read this README
   - Run `examples_unified_predictor.py`

2. **Try It Yourself** (15 min)
   - Run single prediction: `python unified_predictor.py --image data/images/sample.png --visualize`
   - Try batch: `python unified_predictor.py --image-dir data/images/`

3. **Integrate into Code** (30 min)
   - Use Python API in your project
   - Customize thresholds for your use case
   - Check output structure

4. **Optimize for Your Use Case** (1 hour)
   - Select best architecture combination
   - Tune ensemble weights
   - Test on your data

## 🔗 Integration with Training

The unified predictor uses trained models from:
- **[PancreScan/train_ensemble_smart.py](PancreScan/train_ensemble_smart.py)** - For classifier training
- **[PancreScan/run_kfold_cv.py](PancreScan/run_kfold_cv.py)** - For validation

You can:
1. Train new models with these scripts
2. Save checkpoints
3. Load them with the unified predictor
4. No code changes needed!

Example:
```python
# After training your own model
predictor = PancreScanPredictor(
    classifier_names=["efficientnet_v2_s"],
    classifier_paths=["outputs/my_trained_model.pt"]  # Your model
)
```

## ⚠️ Important Notes

### Device Management
```python
# Automatic (recommended)
predictor = PancreScanPredictor(device="auto")

# Explicit GPU
predictor = PancreScanPredictor(device="cuda")

# CPU fallback
predictor = PancreScanPredictor(device="cpu")
```

### Memory Usage
- Single model: ~500MB
- Ensemble (2 models): ~1GB
- Ensemble (3 models): ~1.5GB

### Performance
- Single image: ~0.5-1 second (GPU), ~2-3 seconds (CPU)
- Batch (100 images): ~2-5 minutes (GPU), ~20-30 minutes (CPU)

## 🐛 Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'unified_predictor'"
**Solution:** Make sure you're in the right directory:
```bash
cd c:\projects\pancrescan
python -c "from unified_predictor import PancreScanPredictor"
```

### Issue: "RuntimeError: CUDA out of memory"
**Solution:** Use CPU or reduce batch size:
```python
predictor = PancreScanPredictor(device="cpu")
```

### Issue: Model predictions are all disease/all normal
**Solution:** Check if:
- Image is loaded correctly (use `visualize=True`)
- Model paths are correct
- Model architecture matches checkpoint

## 📞 Next Steps

1. ✅ Run `examples_unified_predictor.py` to see all features
2. ✅ Try single prediction: `python unified_predictor.py --image data/images/sample.png --visualize`
3. ✅ Integrate into your app using the Python API
4. ✅ Check [UNIFIED_PREDICTOR_GUIDE.md](UNIFIED_PREDICTOR_GUIDE.md) for full API reference

## 🎉 Summary

The **Unified Predictor** provides:

| Feature | Benefit |
|---------|---------|
| 🔗 **Chain Segmentation → Classification** | End-to-end pipeline in one function call |
| 🎛️ **Ensemble Support** | Combine multiple models automatically |
| ⚙️ **Smart Configuration** | Presets for different scenarios (fast, accurate, clinical) |
| 📊 **Structured Output** | Easy to integrate with reporting systems |
| 📦 **Batch Processing** | Process 100+ images efficiently |
| 💻 **CLI + Python API** | Works as command-line tool or library |
| 📚 **Full Documentation** | Examples, guides, and API reference |

---

**Ready to use it?** Start with [`examples_unified_predictor.py`](examples_unified_predictor.py)!
