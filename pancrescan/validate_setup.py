"""
Validation script for PancreScan Unified Predictor
Checks that all models and dependencies are properly installed
"""

import os
import sys
from pathlib import Path


def check_dependencies():
    """Check if all required packages are installed"""
    print("🔍 Checking Dependencies...")
    print("-" * 60)
    
    dependencies = {
        "torch": "PyTorch",
        "torchvision": "TorchVision",
        "cv2": "OpenCV",
        "numpy": "NumPy",
        "matplotlib": "Matplotlib",
    }
    
    all_ok = True
    for module_name, display_name in dependencies.items():
        try:
            __import__(module_name)
            version = getattr(__import__(module_name), '__version__', 'installed')
            print(f"  ✅ {display_name:<20} {version}")
        except ImportError:
            print(f"  ❌ {display_name:<20} NOT INSTALLED")
            all_ok = False
    
    if not all_ok:
        print("\n⚠️  Missing packages. Install with:")
        print("   pip install torch torchvision opencv-python matplotlib numpy")
    
    return all_ok


def check_model_files():
    """Check if all required model files exist"""
    print("\n🔍 Checking Model Files...")
    print("-" * 60)
    
    models = {
        "model.pth": "UNet Segmentation Model",
        "PancreScan/outputs/densenet121_best.pt": "DenseNet121 Classifier",
        "PancreScan/outputs/demo_models/efficientnet_v2_s_fold_1_best.pt": "EfficientNet-V2-S Classifier",
    }
    
    all_ok = True
    for model_path, description in models.items():
        if os.path.exists(model_path):
            size_mb = os.path.getsize(model_path) / (1024 * 1024)
            print(f"  ✅ {description:<35} ({size_mb:.1f} MB)")
        else:
            print(f"  ❌ {description:<35} NOT FOUND")
            print(f"     Expected at: {model_path}")
            all_ok = False
    
    return all_ok


def check_source_files():
    """Check if all Python source files exist"""
    print("\n🔍 Checking Source Files...")
    print("-" * 60)
    
    files = {
        "unified_predictor.py": "Unified Predictor",
        "config.py": "Configuration Module",
        "examples_unified_predictor.py": "Examples",
        "predict.py": "Original Predictor",
        "PancreScan/train_ensemble_smart.py": "Ensemble Training",
        "PancreScan/run_kfold_cv.py": "K-Fold Validation",
    }
    
    all_ok = True
    for file_path, description in files.items():
        if os.path.exists(file_path):
            size_kb = os.path.getsize(file_path) / 1024
            print(f"  ✅ {description:<35} ({size_kb:.1f} KB)")
        else:
            print(f"  ⚠️  {description:<35} NOT FOUND")
            print(f"     Expected at: {file_path}")
    
    return all_ok


def check_device():
    """Check available compute devices"""
    print("\n🔍 Checking Compute Device...")
    print("-" * 60)
    
    try:
        import torch
        
        if torch.cuda.is_available():
            print(f"  ✅ CUDA Available")
            print(f"     Device: {torch.cuda.get_device_name(0)}")
            print(f"     Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
        else:
            print(f"  ⚠️  CUDA Not Available (will use CPU)")
        
        print(f"  ✅ PyTorch Version: {torch.__version__}")
        return True
    except Exception as e:
        print(f"  ❌ Error checking device: {e}")
        return False


def test_import():
    """Test if unified_predictor can be imported"""
    print("\n🔍 Testing Imports...")
    print("-" * 60)
    
    try:
        from unified_predictor import PancreScanPredictor, PredictionResult
        print(f"  ✅ unified_predictor.PancreScanPredictor")
        print(f"  ✅ unified_predictor.PredictionResult")
        return True
    except Exception as e:
        print(f"  ❌ Failed to import: {e}")
        return False


def test_config():
    """Test if config module works"""
    print("\n🔍 Testing Configuration...")
    print("-" * 60)
    
    try:
        from config import (
            get_default_config,
            get_fast_config,
            get_gpu_config,
            DecisionThresholds
        )
        print(f"  ✅ config.get_default_config()")
        print(f"  ✅ config.get_fast_config()")
        print(f"  ✅ config.get_gpu_config()")
        print(f"  ✅ config.DecisionThresholds")
        
        # Test instantiating configs
        default = get_default_config()
        print(f"\n  Default Config:")
        print(f"    Models: {', '.join(default.classifier_names)}")
        print(f"    Ensemble Weights: {default.ensemble_weights}")
        
        return True
    except Exception as e:
        print(f"  ❌ Failed to test config: {e}")
        return False


def run_full_validation():
    """Run complete validation suite"""
    print("\n" + "=" * 60)
    print("PancreScan Unified Predictor - Setup Validation")
    print("=" * 60)
    
    results = {
        "dependencies": check_dependencies(),
        "model_files": check_model_files(),
        "source_files": check_source_files(),
        "device": check_device(),
        "imports": test_import(),
        "config": test_config(),
    }
    
    # Summary
    print("\n" + "=" * 60)
    print("VALIDATION SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    status_map = {
        "dependencies": "Dependencies",
        "model_files": "Model Files",
        "source_files": "Source Code",
        "device": "Compute Device",
        "imports": "Module Imports",
        "config": "Configuration",
    }
    
    for key, description in status_map.items():
        status = "✅ PASS" if results[key] else "❌ FAIL"
        print(f"  {status:<10} {description}")
    
    print(f"\nOverall: {passed}/{total} checks passed")
    
    if passed == total:
        print("\n🎉 All checks passed! Ready to use unified predictor.")
        print("\n Quick Start:")
        print("   1. python examples_unified_predictor.py")
        print("   2. python unified_predictor.py --image data/images/sample.png --visualize")
        return True
    else:
        print("\n⚠️  Some checks failed. See details above.")
        return False


def suggest_fixes():
    """Suggest fixes for common issues"""
    print("\n" + "=" * 60)
    print("TROUBLESHOOTING")
    print("=" * 60)
    
    print("""
If you have errors, try these fixes:

1. Missing Dependencies:
   pip install torch torchvision opencv-python matplotlib

2. Model Files Not Found:
   - Check file paths are relative to c:\\projects\\pancrescan\\
   - Verify files with: dir model.pth, dir PancreScan\\outputs\\

3. Import Errors:
   - Ensure working directory is c:\\projects\\pancrescan\\
   - Try: cd c:\\projects\\pancrescan

4. CUDA Errors:
   - Use CPU: predictor = PancreScanPredictor(device="cpu")
   - Check GPU: python -c "import torch; print(torch.cuda.is_available())"

5. Out of Memory:
   - Reduce ensemble size (use 1 model instead of 2)
   - Use CPU instead of GPU
   - Reduce batch size
    """)


if __name__ == "__main__":
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Run validation
    success = run_full_validation()
    
    # Show troubleshooting
    if not success:
        suggest_fixes()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)
