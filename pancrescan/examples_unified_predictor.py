"""
Usage examples for the unified PancreScan predictor
"""

from unified_predictor import PancreScanPredictor, PredictionResult
import json
from pathlib import Path


def example_1_single_prediction():
    """Example 1: Single image prediction with visualization"""
    print("\n" + "="*70)
    print("EXAMPLE 1: Single Image Prediction")
    print("="*70)
    
    predictor = PancreScanPredictor(
        seg_model_path="model.pth",
        classifier_names=["densenet121", "efficientnet_v2_s"],
        classifier_paths=[
            "PancreScan/outputs/densenet121_best.pt",
            "PancreScan/outputs/demo_models/efficientnet_v2_s_fold_1_best.pt"
        ],
        ensemble_weights=[0.5, 0.5],
        device="auto"
    )
    
    # Single prediction
    result = predictor.predict(
        "data/images/pancreas_001_33.png",
        visualize=False  # Skip plots for faster execution
    )
    
    # Access results
    print(f"\n📊 Prediction Results:")
    print(f"  Disease Probability: {result.disease_probability:.2%}")
    print(f"  Predicted Class: {'🔴 DISEASE' if result.predicted_class == 1 else '🟢 NORMAL'}")
    print(f"  Tumor Area (segmentation): {result.tumor_area_percentage:.2f}%")
    print(f"  Segmentation Confidence: {result.segmentation_confidence:.2%}")
    print(f"  Probabilities: Normal={result.classification_probabilities[0]:.2%}, Disease={result.classification_probabilities[1]:.2%}")


def example_2_batch_processing():
    """Example 2: Batch process all images in a directory"""
    print("\n" + "="*70)
    print("EXAMPLE 2: Batch Processing Directory")
    print("="*70)
    
    predictor = PancreScanPredictor(
        seg_model_path="model.pth",
        classifier_names=["densenet121", "efficientnet_v2_s"],
        classifier_paths=[
            "PancreScan/outputs/densenet121_best.pt",
            "PancreScan/outputs/demo_models/efficientnet_v2_s_fold_1_best.pt"
        ],
        ensemble_weights=[0.5, 0.5]
    )
    
    # Batch prediction
    results = predictor.predict_batch("data/images/")
    
    # Process results
    print(f"\n📈 Batch Results ({len(results)} images):")
    positives = sum(1 for r in results if r.predicted_class == 1)
    print(f"  Detected disease in: {positives}/{len(results)} images")
    
    for i, result in enumerate(results, 1):
        status = "🔴 DISEASE" if result.predicted_class == 1 else "🟢 NORMAL"
        print(f"  {i}. {status} (prob={result.disease_probability:.2%}, area={result.tumor_area_percentage:.2f}%)")


def example_3_programmatic_with_custom_thresholds():
    """Example 3: Use predictor programmatically with custom decision thresholds"""
    print("\n" + "="*70)
    print("EXAMPLE 3: Custom Thresholds")
    print("="*70)
    
    predictor = PancreScanPredictor(
        seg_model_path="model.pth",
        classifier_names=["densenet121"],
        classifier_paths=["PancreScan/outputs/densenet121_best.pt"],
        device="auto"
    )
    
    result = predictor.predict("data/images/pancreas_001_33.png")
    
    # Custom decision logic
    DISEASE_THRESHOLD = 0.6  # More conservative
    AREA_THRESHOLD = 5.0     # Minimum tumor area
    
    print(f"\n🎯 Custom Decision Logic:")
    print(f"  Disease Threshold: {DISEASE_THRESHOLD:.0%}")
    print(f"  Area Threshold: {AREA_THRESHOLD:.1f}%")
    
    disease_detected = (
        result.disease_probability >= DISEASE_THRESHOLD and
        result.tumor_area_percentage >= AREA_THRESHOLD
    )
    
    confidence_level = "HIGH" if result.disease_probability > 0.8 else \
                       "MEDIUM" if result.disease_probability > 0.6 else "LOW"
    
    print(f"\n  Decision: {'🔴 POSITIVE' if disease_detected else '🟢 NEGATIVE'}")
    print(f"  Confidence: {confidence_level}")
    print(f"  P(disease) = {result.disease_probability:.2%}")
    print(f"  Tumor area = {result.tumor_area_percentage:.2f}%")


def example_4_save_results_to_json():
    """Example 4: Save predictions to JSON for reporting"""
    print("\n" + "="*70)
    print("EXAMPLE 4: Save Results to JSON")
    print("="*70)
    
    predictor = PancreScanPredictor(
        seg_model_path="model.pth",
        classifier_names=["densenet121", "efficientnet_v2_s"],
        classifier_paths=[
            "PancreScan/outputs/densenet121_best.pt",
            "PancreScan/outputs/demo_models/efficientnet_v2_s_fold_1_best.pt"
        ]
    )
    
    # Process images
    image_dir = Path("data/images/")
    results = predictor.predict_batch(str(image_dir))
    
    # Convert to JSON-serializable format
    report = {
        "total_images": len(results),
        "positive_cases": sum(1 for r in results if r.predicted_class == 1),
        "predictions": []
    }
    
    for i, result in enumerate(results, 1):
        report["predictions"].append({
            "image_id": i,
            "disease": bool(result.predicted_class == 1),
            "disease_probability": float(result.disease_probability),
            "tumor_area_percentage": float(result.tumor_area_percentage),
            "segmentation_confidence": float(result.segmentation_confidence),
            "class_probabilities": {
                "normal": float(result.classification_probabilities[0]),
                "disease": float(result.classification_probabilities[1])
            },
            "ensemble_weights": result.ensemble_weights
        })
    
    # Save to file
    output_path = "pancrescan_predictions.json"
    with open(output_path, "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\n✅ Results saved to {output_path}")
    print(f"\nSummary:")
    print(f"  Total: {report['total_images']} images")
    print(f"  Positive: {report['positive_cases']} images")
    print(f"  Positive Rate: {report['positive_cases']/report['total_images']:.1%}")


def example_5_single_vs_ensemble_comparison():
    """Example 5: Compare single model vs ensemble predictions"""
    print("\n" + "="*70)
    print("EXAMPLE 5: Single Model vs Ensemble")
    print("="*70)
    
    image_path = "data/images/pancreas_001_33.png"
    
    # Single model
    predictor_single = PancreScanPredictor(
        seg_model_path="model.pth",
        classifier_names=["densenet121"],
        classifier_paths=["PancreScan/outputs/densenet121_best.pt"],
    )
    result_single = predictor_single.predict(image_path)
    
    # Ensemble
    predictor_ensemble = PancreScanPredictor(
        seg_model_path="model.pth",
        classifier_names=["densenet121", "efficientnet_v2_s"],
        classifier_paths=[
            "PancreScan/outputs/densenet121_best.pt",
            "PancreScan/outputs/demo_models/efficientnet_v2_s_fold_1_best.pt"
        ],
        ensemble_weights=[0.5, 0.5]
    )
    result_ensemble = predictor_ensemble.predict(image_path)
    
    print(f"\n🔬 Model Comparison:")
    print(f"  {'Model':<30} {'Disease Prob':<20} {'Decision':<15}")
    print(f"  {'-'*65}")
    print(f"  {'DenseNet121 (Single)':<30} {result_single.disease_probability:>18.2%} {'DISEASE' if result_single.predicted_class == 1 else 'NORMAL':>14}")
    print(f"  {'Ensemble (2 models)':<30} {result_ensemble.disease_probability:>18.2%} {'DISEASE' if result_ensemble.predicted_class == 1 else 'NORMAL':>14}")
    
    # Agreement
    agreement = result_single.predicted_class == result_ensemble.predicted_class
    print(f"\n  Models agree: {'✅ YES' if agreement else '❌ NO'}")


def example_6_use_different_architectures():
    """Example 6: Try different classification architectures"""
    print("\n" + "="*70)
    print("EXAMPLE 6: Different Model Architectures")
    print("="*70)
    
    architectures = [
        ("DenseNet121", ["densenet121"]),
        ("EfficientNet-B0", ["efficientnet_b0"]),
        ("EfficientNet-V2-S", ["efficientnet_v2_s"]),
        ("ResNet50", ["resnet50"]),
        ("ConvNeXt-Tiny", ["convnext_tiny"]),
    ]
    
    image_path = "data/images/pancreas_001_33.png"
    
    print(f"\n📊 Architecture Comparison:")
    print(f"  {'Architecture':<25} {'Disease Probability':<20}")
    print(f"  {'-'*45}")
    
    for arch_name, model_names in architectures:
        try:
            predictor = PancreScanPredictor(
                seg_model_path="model.pth",
                classifier_names=model_names,
                classifier_paths=[f"path/to/{model_names[0]}_best.pt"],
            )
            result = predictor.predict(image_path)
            print(f"  {arch_name:<25} {result.disease_probability:>18.2%}")
        except Exception as e:
            print(f"  {arch_name:<25} {'[Model not found]':>18}")


def example_7_confidence_scoring():
    """Example 7: Calculate confidence scores for medical decision support"""
    print("\n" + "="*70)
    print("EXAMPLE 7: Confidence Scoring for Clinical Use")
    print("="*70)
    
    predictor = PancreScanPredictor(
        seg_model_path="model.pth",
        classifier_names=["densenet121", "efficientnet_v2_s"],
        classifier_paths=[
            "PancreScan/outputs/densenet121_best.pt",
            "PancreScan/outputs/demo_models/efficientnet_v2_s_fold_1_best.pt"
        ]
    )
    
    result = predictor.predict("data/images/pancreas_001_33.png")
    
    # Compute confidence score
    classification_confidence = max(result.classification_probabilities)
    segmentation_confidence = result.segmentation_confidence
    overall_confidence = (classification_confidence * 0.7 + segmentation_confidence * 0.3)
    
    print(f"\n🎖️ Confidence Scores:")
    print(f"  Classification: {classification_confidence:.2%}")
    print(f"  Segmentation:   {segmentation_confidence:.2%}")
    print(f"  Overall (weighted): {overall_confidence:.2%}")
    
    if overall_confidence > 0.85:
        recommendation = "🟢 HIGH CONFIDENCE - Recommend clinical follow-up based on prediction"
    elif overall_confidence > 0.70:
        recommendation = "🟡 MEDIUM CONFIDENCE - Consider secondary review"
    else:
        recommendation = "🔴 LOW CONFIDENCE - Recommend manual review or additional imaging"
    
    print(f"\n  Recommendation: {recommendation}")


if __name__ == "__main__":
    # Uncomment the example you want to run:
    
    # example_1_single_prediction()
    # example_2_batch_processing()
    # example_3_programmatic_with_custom_thresholds()
    # example_4_save_results_to_json()
    # example_5_single_vs_ensemble_comparison()
    # example_6_use_different_architectures()
    example_7_confidence_scoring()
    
    print("\n✨ All examples completed!")
