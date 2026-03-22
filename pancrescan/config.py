"""
Configuration file for Unified PancreScan Predictor
Defines default paths, architectures, and hyperparameters
"""

from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class PredictorConfig:
    """Configuration for PancreScan predictor"""
    
    # Segmentation model
    seg_model_path: str = "model.pth"
    seg_model_name: str = "UNet"
    
    # Classification models
    classifier_names: List[str] = None  # Will default in __post_init__
    classifier_paths: List[str] = None  # Will default in __post_init__
    ensemble_weights: Optional[List[float]] = None  # Will default to equal weights
    
    # Device
    device: str = "auto"  # auto, cuda, cpu
    
    # Image processing
    img_size: int = 256
    
    # Segmentation thresholds
    seg_probability_threshold: float = 0.5
    
    # Classification thresholds
    disease_probability_threshold: float = 0.5
    
    def __post_init__(self):
        """Set defaults after initialization"""
        if self.classifier_names is None:
            self.classifier_names = [
                "densenet121",
                "efficientnet_v2_s"
            ]
        
        if self.classifier_paths is None:
            self.classifier_paths = [
                "PancreScan/outputs/densenet121_best.pt",
                "PancreScan/outputs/demo_models/efficientnet_v2_s_fold_1_best.pt"
            ]
        
        if self.ensemble_weights is None:
            # Equal weights
            self.ensemble_weights = [1.0 / len(self.classifier_names)] * len(self.classifier_names)
        else:
            # Normalize to sum to 1
            total = sum(self.ensemble_weights)
            self.ensemble_weights = [w / total for w in self.ensemble_weights]


# ============================================================================
# PRESET CONFIGURATIONS
# ============================================================================

def get_default_config() -> PredictorConfig:
    """Default config: 2-model ensemble"""
    return PredictorConfig(
        classifier_names=["densenet121", "efficientnet_v2_s"],
        classifier_paths=[
            "PancreScan/outputs/densenet121_best.pt",
            "PancreScan/outputs/demo_models/efficientnet_v2_s_fold_1_best.pt"
        ],
        ensemble_weights=[0.5, 0.5],
        device="auto"
    )


def get_fast_config() -> PredictorConfig:
    """Fast config: Single model (fastest)"""
    return PredictorConfig(
        classifier_names=["densenet121"],
        classifier_paths=["PancreScan/outputs/densenet121_best.pt"],
        ensemble_weights=[1.0],
        device="auto"
    )


def get_accurate_config() -> PredictorConfig:
    """Accurate config: 3-model ensemble (most robust)"""
    return PredictorConfig(
        classifier_names=["densenet121", "efficientnet_v2_s", "convnext_tiny"],
        classifier_paths=[
            "PancreScan/outputs/densenet121_best.pt",
            "PancreScan/outputs/demo_models/efficientnet_v2_s_fold_1_best.pt",
            "PancreScan/outputs/convnext_tiny_best.pt"  # If available
        ],
        ensemble_weights=[0.33, 0.33, 0.34],
        device="auto"
    )


def get_gpu_config() -> PredictorConfig:
    """GPU config: Optimized for CUDA devices"""
    return PredictorConfig(
        classifier_names=["densenet121", "efficientnet_v2_s"],
        classifier_paths=[
            "PancreScan/outputs/densenet121_best.pt",
            "PancreScan/outputs/demo_models/efficientnet_v2_s_fold_1_best.pt"
        ],
        ensemble_weights=[0.5, 0.5],
        device="cuda"
    )


def get_cpu_config() -> PredictorConfig:
    """CPU config: Optimized for CPU devices"""
    return PredictorConfig(
        classifier_names=["densenet121"],  # Single model for CPU speed
        classifier_paths=["PancreScan/outputs/densenet121_best.pt"],
        ensemble_weights=[1.0],
        device="cpu"
    )


def get_clinical_config() -> PredictorConfig:
    """Clinical config: Conservative thresholds for medical use"""
    config = get_accurate_config()
    config.disease_probability_threshold = 0.6  # More conservative
    return config


def get_demo_config() -> PredictorConfig:
    """Demo config: Works with provided demo models"""
    return PredictorConfig(
        classifier_names=["densenet121", "efficientnet_v2_s"],
        classifier_paths=[
            "PancreScan/outputs/densenet121_best.pt",
            "PancreScan/outputs/demo_models/efficientnet_v2_s_fold_1_best.pt"
        ],
        ensemble_weights=[0.5, 0.5],
        device="auto"
    )


# ============================================================================
# DECISION THRESHOLDS
# ============================================================================

@dataclass
class DecisionThresholds:
    """Clinical decision thresholds"""
    
    # Classification confidence
    disease_probability_high: float = 0.80       # High confidence disease
    disease_probability_medium: float = 0.60     # Medium confidence
    disease_probability_low: float = 0.40        # Low confidence
    
    # Segmentation
    min_tumor_area: float = 1.0                  # Minimum % for positive
    max_segmentation_noise: float = 0.3          # Max noise tolerance
    
    # Overall confidence
    min_confidence_for_decision: float = 0.70    # Minimum overall confidence
    
    def get_confidence_level(self, disease_prob: float, area: float, seg_conf: float) -> str:
        """Classify confidence level"""
        if disease_prob > self.disease_probability_high and area > self.min_tumor_area:
            return "HIGH"
        elif disease_prob > self.disease_probability_medium and area > 0.5 * self.min_tumor_area:
            return "MEDIUM"
        else:
            return "LOW"
    
    def should_flag_for_review(self, disease_prob: float, area: float, seg_conf: float) -> bool:
        """Flag case if uncertainty is high"""
        near_threshold = abs(disease_prob - 0.5) < 0.15
        low_segmentation = seg_conf < max(0.5, self.max_segmentation_noise)
        
        return near_threshold or low_segmentation


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == "__main__":
    # Load different configs
    configs = {
        "default": get_default_config(),
        "fast": get_fast_config(),
        "accurate": get_accurate_config(),
        "gpu": get_gpu_config(),
        "cpu": get_cpu_config(),
        "clinical": get_clinical_config(),
        "demo": get_demo_config(),
    }
    
    print("Available Configurations:")
    print("=" * 70)
    
    for name, config in configs.items():
        print(f"\n{name.upper()}")
        print(f"  Models: {', '.join(config.classifier_names)}")
        print(f"  Device: {config.device}")
        print(f"  Ensemble Size: {len(config.classifier_names)}")
        print(f"  Weights: {[f'{w:.2f}' for w in config.ensemble_weights]}")
    
    # Decision thresholds
    thresholds = DecisionThresholds()
    print(f"\n\nDecision Thresholds:")
    print(f"  High Confidence: P(disease) > {thresholds.disease_probability_high:.0%}")
    print(f"  Medium Confidence: P(disease) > {thresholds.disease_probability_medium:.0%}")
    print(f"  Low Confidence: P(disease) > {thresholds.disease_probability_low:.0%}")
    print(f"  Min Tumor Area: {thresholds.min_tumor_area:.1f}%")
    
    # Example: Get high-accuracy GPU config
    print(f"\n\nUsage Example:")
    print(f"  from config import get_gpu_config")
    print(f"  from unified_predictor import PancreScanPredictor")
    print(f"  ")
    print(f"  config = get_gpu_config()")
    print(f"  predictor = PancreScanPredictor(")
    print(f"      seg_model_path=config.seg_model_path,")
    print(f"      classifier_names=config.classifier_names,")
    print(f"      classifier_paths=config.classifier_paths,")
    print(f"      ensemble_weights=config.ensemble_weights,")
    print(f"      device=config.device")
    print(f"  )")
