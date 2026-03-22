"""
Unified Pancreatic Cancer Detection Pipeline
Chains segmentation (UNet) → classification (Ensemble) for end-to-end prediction
"""

import os
import cv2
import torch
import numpy as np
import torch.nn as nn
from typing import Dict, Tuple, Optional, List
from pathlib import Path
from dataclasses import dataclass
import matplotlib.pyplot as plt
from torchvision import models, transforms


@dataclass
class PredictionResult:
    """Structured output from unified predictor"""
    segmentation_mask: np.ndarray          # Binary mask (0/1)
    segmentation_confidence: float         # Sigmoid output (0-1)
    tumor_area_percentage: float           # % of image showing tumor
    classification_logits: torch.Tensor    # Raw model outputs
    classification_probabilities: np.ndarray  # Softmax output
    disease_probability: float             # P(diseased)
    predicted_class: int                   # Class index
    ensemble_weights: Optional[List[float]] = None
    image_shape: Tuple[int, int] = (256, 256)


# ============================================================================
# SEGMENTATION MODEL (UNet)
# ============================================================================

class DoubleConv(nn.Module):
    """Double convolution block with batch norm and ReLU"""
    def __init__(self, in_c: int, out_c: int):
        super().__init__()
        self.seq = nn.Sequential(
            nn.Conv2d(in_c, out_c, 3, padding=1),
            nn.BatchNorm2d(out_c),
            nn.ReLU(),
            nn.Conv2d(out_c, out_c, 3, padding=1),
            nn.BatchNorm2d(out_c),
            nn.ReLU()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.seq(x)


class UNet(nn.Module):
    """UNet architecture for pancreas segmentation"""
    def __init__(self):
        super().__init__()
        # Encoder
        self.d1 = DoubleConv(1, 64)
        self.d2 = DoubleConv(64, 128)
        self.d3 = DoubleConv(128, 256)

        self.pool = nn.MaxPool2d(2)

        # Decoder
        self.u1 = DoubleConv(256 + 128, 128)
        self.u2 = DoubleConv(128 + 64, 64)

        self.up = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True)

        # Output
        self.out = nn.Conv2d(64, 1, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        d1 = self.d1(x)
        d2 = self.d2(self.pool(d1))
        d3 = self.d3(self.pool(d2))

        u1 = self.up(d3)
        u1 = torch.cat([u1, d2], dim=1)
        u1 = self.u1(u1)

        u2 = self.up(u1)
        u2 = torch.cat([u2, d1], dim=1)
        u2 = self.u2(u2)

        return self.out(u2)


# ============================================================================
# CLASSIFICATION MODELS
# ============================================================================

def build_classifier(model_name: str, num_classes: int = 2) -> nn.Module:
    """Build classification model with pretrained weights"""
    if model_name == "densenet121":
        weights = models.DenseNet121_Weights.IMAGENET1K_V1
        model = models.densenet121(weights=weights)
        model.classifier = nn.Linear(model.classifier.in_features, num_classes)
        return model
    
    elif model_name == "efficientnet_b0":
        weights = models.EfficientNet_B0_Weights.IMAGENET1K_V1
        model = models.efficientnet_b0(weights=weights)
        model.classifier[1] = nn.Sequential(
            nn.Dropout(p=0.5),
            nn.Linear(model.classifier[1].in_features, num_classes)
        )
        return model
    
    elif model_name == "efficientnet_v2_s":
        weights = models.EfficientNet_V2_S_Weights.IMAGENET1K_V1
        model = models.efficientnet_v2_s(weights=weights)
        model.classifier[1] = nn.Sequential(
            nn.Dropout(p=0.5),
            nn.Linear(model.classifier[1].in_features, num_classes)
        )
        return model
    
    elif model_name == "resnet50":
        weights = models.ResNet50_Weights.IMAGENET1K_V2
        model = models.resnet50(weights=weights)
        model.fc = nn.Linear(model.fc.in_features, num_classes)
        return model
    
    elif model_name == "convnext_tiny":
        weights = models.ConvNeXt_Tiny_Weights.IMAGENET1K_V1
        model = models.convnext_tiny(weights=weights)
        model.classifier[2] = nn.Sequential(
            nn.Dropout(p=0.5),
            nn.Linear(model.classifier[2].in_features, num_classes)
        )
        return model
    
    else:
        raise ValueError(f"Unsupported model: {model_name}")


# ============================================================================
# UNIFIED PREDICTOR
# ============================================================================

class PancreScanPredictor:
    """
    Unified end-to-end pipeline for pancreatic cancer detection.
    
    Workflow:
    1. Load image → preprocess
    2. Segmentation (UNet) → get tumor mask & area
    3. Classification (Ensemble) → disease probability
    4. Return comprehensive predictions
    
    Example:
        predictor = PancreScanPredictor(
            seg_model_path="model.pth",
            classifier_names=["densenet121", "efficientnet_v2_s"],
            classifier_paths=["densenet121_best.pt", "efficientnet_v2_s_best.pt"],
            ensemble_weights=[0.5, 0.5]
        )
        result = predictor.predict("path/to/image.png")
    """
    
    def __init__(
        self,
        seg_model_path: str = "model.pth",
        classifier_names: Optional[List[str]] = None,
        classifier_paths: Optional[List[str]] = None,
        ensemble_weights: Optional[List[float]] = None,
        device: str = "auto",
        img_size: int = 256,
    ):
        """
        Initialize the unified predictor.
        
        Args:
            seg_model_path: Path to UNet segmentation model (.pth)
            classifier_names: List of model names (e.g., ["densenet121", "efficientnet_v2_s"])
            classifier_paths: List of classifier checkpoint paths
            ensemble_weights: Weights for ensemble (default: equal weighting)
            device: "auto" (cuda if available, else cpu), "cuda", or "cpu"
            img_size: Input image size (default: 256)
        """
        # Setup device
        if device == "auto":
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        print(f"[PancreScan] Using device: {self.device}")
        
        self.img_size = img_size
        
        # Load segmentation model
        print(f"[PancreScan] Loading segmentation model from {seg_model_path}...")
        self.seg_model = UNet().to(self.device)
        self.seg_model.load_state_dict(
            torch.load(seg_model_path, map_location=self.device)
        )
        self.seg_model.eval()
        
        # Setup classification models (single or ensemble)
        self.classifiers = []
        self.classifier_names = classifier_names or ["densenet121"]
        
        if classifier_paths is None:
            # Single model path overrides
            self.classifier_paths = []
        else:
            self.classifier_paths = classifier_paths
        
        # Load classifiers
        for i, model_name in enumerate(self.classifier_names):
            print(f"[PancreScan] Loading classifier {i+1}/{len(self.classifier_names)}: {model_name}...")
            classifier = build_classifier(model_name, num_classes=2).to(self.device)
            
            if i < len(self.classifier_paths):
                classifier.load_state_dict(
                    torch.load(self.classifier_paths[i], map_location=self.device)
                )
            
            classifier.eval()
            self.classifiers.append(classifier)
        
        # Ensemble weighting
        if ensemble_weights is None:
            self.ensemble_weights = [1.0 / len(self.classifiers)] * len(self.classifiers)
        else:
            total = sum(ensemble_weights)
            self.ensemble_weights = [w / total for w in ensemble_weights]
        
        print(f"[PancreScan] Ensemble weights: {self.ensemble_weights}")
        
        # Image transforms for classification
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=(0.485, 0.456, 0.406),
                std=(0.229, 0.224, 0.225)
            ),
        ])
    
    def _load_image(self, image_path: str) -> np.ndarray:
        """Load image in grayscale"""
        img = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError(f"Failed to load image: {image_path}")
        return cv2.resize(img, (self.img_size, self.img_size))
    
    def _segment(self, image: np.ndarray) -> Tuple[np.ndarray, float]:
        """
        Run segmentation with UNet.
        
        Returns:
            mask: Binary segmentation mask (0/1)
            confidence: Average sigmoid output of tumor region
        """
        # Normalize to [0, 1]
        img_tensor = torch.tensor(image / 255.0, dtype=torch.float32).unsqueeze(0).unsqueeze(0)
        img_tensor = img_tensor.to(self.device)
        
        with torch.no_grad():
            logits = self.seg_model(img_tensor)
            probs = torch.sigmoid(logits).squeeze().cpu().numpy()
        
        # Binary mask
        mask = (probs > 0.5).astype(np.uint8)
        
        # Post-processing: remove noise
        kernel = np.ones((3, 3), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        
        # Keep only largest connected component
        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask)
        if num_labels > 1:
            largest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
            mask = (labels == largest).astype(np.uint8)
        
        # Average confidence in tumor region
        confidence = probs[mask == 1].mean() if mask.sum() > 0 else 0.0
        
        return mask, float(confidence)
    
    def _classify(self, image: np.ndarray) -> Tuple[np.ndarray, torch.Tensor]:
        """
        Run ensemble classification.
        
        Args:
            image: Grayscale image (HxW)
        
        Returns:
            probabilities: [P(normal), P(disease)]
            logits: Raw model outputs
        """
        from PIL import Image
        
        # Convert grayscale to RGB
        if len(image.shape) == 2:
            image_rgb = np.stack([image, image, image], axis=-1)
        else:
            image_rgb = image
        
        # Convert to PIL Image for transforms
        image_pil = Image.fromarray(image_rgb.astype(np.uint8))
        
        # Apply transforms
        img_tensor = self.transform(image_pil).unsqueeze(0).to(self.device)
        
        # Ensemble inference
        logits_list = []
        with torch.no_grad():
            for classifier in self.classifiers:
                logits = classifier(img_tensor)
                logits_list.append(logits)
        
        # Weighted average of logits
        logits_ensemble = torch.stack(logits_list, dim=0)  # (num_models, batch, num_classes)
        weights = torch.tensor(self.ensemble_weights, dtype=torch.float32, device=self.device)
        weights = weights.view(-1, 1, 1)  # (num_models, 1, 1)
        logits = (logits_ensemble * weights).sum(dim=0)  # (batch, num_classes)
        
        probs = torch.softmax(logits, dim=1).squeeze().cpu().numpy()
        
        return probs, logits.squeeze().cpu()
    
    def predict(self, image_path: str, visualize: bool = False) -> PredictionResult:
        """
        End-to-end prediction: segmentation → classification
        
        Args:
            image_path: Path to medical image (grayscale or RGB)
            visualize: Whether to show visualization
        
        Returns:
            PredictionResult with all prediction details
        """
        # Load image
        image = self._load_image(image_path)
        
        # Segmentation
        mask, seg_conf = self._segment(image)
        tumor_area = (mask.sum() / mask.size) * 100
        
        # Classification
        probs, logits = self._classify(image)
        predicted_class = int(np.argmax(probs))
        disease_prob = float(probs[1])  # P(disease)
        
        result = PredictionResult(
            segmentation_mask=mask,
            segmentation_confidence=seg_conf,
            tumor_area_percentage=tumor_area,
            classification_logits=logits,
            classification_probabilities=probs,
            disease_probability=disease_prob,
            predicted_class=predicted_class,
            ensemble_weights=self.ensemble_weights,
            image_shape=image.shape,
        )
        
        # Visualization
        if visualize:
            self._visualize(image, mask, probs, disease_prob, tumor_area)
        
        return result
    
    def _visualize(
        self,
        image: np.ndarray,
        mask: np.ndarray,
        probs: np.ndarray,
        disease_prob: float,
        tumor_area: float,
    ) -> None:
        """Visualize segmentation + classification results"""
        # Create colored image
        image_color = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        overlay = image_color.copy()
        overlay[mask == 1] = [0, 0, 255]  # Red for tumor
        overlay = cv2.addWeighted(image_color, 0.7, overlay, 0.3, 0)
        
        # Plot
        fig, axes = plt.subplots(1, 3, figsize=(15, 5))
        
        axes[0].imshow(image, cmap="gray")
        axes[0].set_title("Original Image")
        axes[0].axis("off")
        
        axes[1].imshow(mask, cmap="gray")
        axes[1].set_title(f"Segmentation\nArea: {tumor_area:.2f}%\nConf: {disease_prob:.2%}")
        axes[1].axis("off")
        
        axes[2].imshow(overlay)
        axes[2].set_title(f"Decision: {'DISEASE' if probs[1] > 0.5 else 'NORMAL'}\nProb: {disease_prob:.2%}")
        axes[2].axis("off")
        
        plt.tight_layout()
        plt.show()
    
    def predict_batch(self, image_dir: str, visualize: bool = False) -> List[PredictionResult]:
        """Run predictions on all images in a directory"""
        results = []
        image_dir = Path(image_dir)
        
        for img_file in sorted(image_dir.glob("*.png")) + sorted(image_dir.glob("*.jpg")):
            print(f"[PancreScan] Predicting {img_file.name}...")
            result = self.predict(str(img_file), visualize=visualize)
            results.append(result)
        
        return results


# ============================================================================
# CLI / DEMO
# ============================================================================

def main():
    """Demo usage"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Unified PancreScan predictor (segmentation + classification)"
    )
    parser.add_argument("--image", type=str, help="Path to image file")
    parser.add_argument("--image-dir", type=str, help="Path to image directory (batch)")
    parser.add_argument("--seg-model", default="model.pth", help="Segmentation model path")
    parser.add_argument(
        "--classifiers",
        default="densenet121,efficientnet_v2_s",
        help="Comma-separated classifier names"
    )
    parser.add_argument(
        "--classifier-paths",
        default="PancreScan/outputs/densenet121_best.pt,PancreScan/outputs/demo_models/efficientnet_v2_s_fold_1_best.pt",
        help="Comma-separated classifier checkpoint paths"
    )
    parser.add_argument(
        "--ensemble-weights",
        default="0.5,0.5",
        help="Comma-separated ensemble weights"
    )
    parser.add_argument("--visualize", action="store_true", help="Show visualization")
    parser.add_argument("--device", default="auto", help="Device: auto, cuda, or cpu")
    
    args = parser.parse_args()
    
    # Parse arguments
    classifier_names = [n.strip() for n in args.classifiers.split(",")]
    classifier_paths = [p.strip() for p in args.classifier_paths.split(",")]
    ensemble_weights = [float(w.strip()) for w in args.ensemble_weights.split(",")]
    
    # Initialize predictor
    predictor = PancreScanPredictor(
        seg_model_path=args.seg_model,
        classifier_names=classifier_names,
        classifier_paths=classifier_paths,
        ensemble_weights=ensemble_weights,
        device=args.device,
    )
    
    # Run prediction
    if args.image:
        result = predictor.predict(args.image, visualize=args.visualize)
        print("\n" + "="*60)
        print("PREDICTION RESULT")
        print("="*60)
        print(f"Disease Probability: {result.disease_probability:.2%}")
        print(f"Predicted Class: {'DISEASE' if result.predicted_class == 1 else 'NORMAL'}")
        print(f"Tumor Area: {result.tumor_area_percentage:.2f}%")
        print(f"Segmentation Confidence: {result.segmentation_confidence:.2%}")
        print(f"Classification Logits: {result.classification_logits.numpy()}")
        print(f"Class Probabilities: Normal={result.classification_probabilities[0]:.2%}, Disease={result.classification_probabilities[1]:.2%}")
        print("="*60)
    
    elif args.image_dir:
        results = predictor.predict_batch(args.image_dir, visualize=args.visualize)
        print(f"\nProcessed {len(results)} images")
        for i, result in enumerate(results):
            print(f"  {i+1}. P(disease)={result.disease_probability:.2%}, Area={result.tumor_area_percentage:.2f}%")


if __name__ == "__main__":
    main()
