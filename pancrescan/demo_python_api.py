"""
Python API Demo - PancreScan Unified Predictor
Shows practical usage of the unified predictor as a Python library
"""

from unified_predictor import PancreScanPredictor
import os

print("\n" + "="*70)
print("PYTHON API DEMO - PancreScan Unified Predictor")
print("="*70)

print("\n🔧 Initializing predictor...")
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

print("✅ Predictor initialized successfully!")

# Get list of images
image_dir = "data/images"
images = sorted([f for f in os.listdir(image_dir) if f.endswith('.png')])[:5]

print(f"\n📊 Making predictions on {len(images)} images...")
print("-" * 70)

results = []
for i, image_file in enumerate(images, 1):
    image_path = os.path.join(image_dir, image_file)
    print(f"\n{i}. {image_file}")
    
    result = predictor.predict(image_path)
    results.append(result)
    
    # Access result fields
    print(f"   Disease Probability: {result.disease_probability:.2%}")
    print(f"   Tumor Area: {result.tumor_area_percentage:.2f}%")
    print(f"   Prediction: {'🔴 DISEASE' if result.predicted_class == 1 else '🟢 NORMAL'}")
    print(f"   Seg Confidence: {result.segmentation_confidence:.2%}")
    print(f"   Class Probs: Normal={result.classification_probabilities[0]:.2%}, Disease={result.classification_probabilities[1]:.2%}")

# Summary
print("\n" + "="*70)
print("SUMMARY")
print("="*70)
positive = sum(1 for r in results if r.predicted_class == 1)
negative = len(results) - positive
avg_disease_prob = sum(r.disease_probability for r in results) / len(results)
avg_tumor_area = sum(r.tumor_area_percentage for r in results) / len(results)

print(f"Total Images: {len(results)}")
print(f"Positive Cases: {positive}")
print(f"Negative Cases: {negative}")
print(f"Average Disease Probability: {avg_disease_prob:.2%}")
print(f"Average Tumor Area: {avg_tumor_area:.2f}%")
print(f"Ensemble Models: {', '.join(predictor.classifier_names)}")
print(f"Ensemble Weights: {predictor.ensemble_weights}")

print("\n✨ Python API Demo Complete!")
