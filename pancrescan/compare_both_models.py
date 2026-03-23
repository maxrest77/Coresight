"""
Side-by-Side Comparison: Segmentation vs Classification
Shows results from both models together for comprehensive analysis
"""

from unified_predictor import PancreScanPredictor
import os

print("\n" + "="*80)
print("SEGMENTATION + CLASSIFICATION SIDE-BY-SIDE RESULTS")
print("="*80)

print("\n🔧 Initializing Unified Predictor...")
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

print("✅ Ready!\n")

# Get images
image_dir = "data/images"
images = sorted([f for f in os.listdir(image_dir) if f.endswith('.png')])[:8]

print(f"📊 Processing {len(images)} images...\n")

results = []
for idx, image_file in enumerate(images, 1):
    image_path = os.path.join(image_dir, image_file)
    result = predictor.predict(image_path)
    results.append((image_file, result))

# Display results
print("="*80)
print("DETAILED RESULTS - SEGMENTATION vs CLASSIFICATION")
print("="*80)

for i, (filename, result) in enumerate(results, 1):
    print(f"\n[{i}] {filename}")
    print("-" * 80)
    
    # SEGMENTATION RESULTS
    print("  SEGMENTATION (UNet):")
    print(f"    ├─ Tumor Area: {result.tumor_area_percentage:.2f}%")
    print(f"    ├─ Segmentation Confidence: {result.segmentation_confidence:.2%}")
    print(f"    └─ Status: {'🔴 Tumor Detected' if result.tumor_area_percentage > 1.0 else '🟢 No Tumor'}")
    
    # CLASSIFICATION RESULTS
    print("\n  CLASSIFICATION (Ensemble: DenseNet121 + EfficientNet-V2-S):")
    print(f"    ├─ Disease Probability: {result.disease_probability:.2%}")
    print(f"    ├─ Normal Probability: {result.classification_probabilities[0]:.2%}")
    print(f"    ├─ Prediction: {'🔴 DISEASE' if result.predicted_class == 1 else '🟢 NORMAL'}")
    print(f"    └─ Confidence: {max(result.classification_probabilities):.2%}")
    
    # COMBINED ASSESSMENT
    seg_detected = result.tumor_area_percentage > 1.0
    clf_detected = result.predicted_class == 1
    
    if seg_detected and clf_detected:
        assessment = "🔴 CRITICAL: Both segmentation and classification detect disease"
        color = "BOTH_AGREE"
    elif seg_detected and not clf_detected:
        assessment = "🟡 WARNING: Tumor visible but classifier says normal (review carefully)"
        color = "DISAGREEMENT"
    elif not seg_detected and clf_detected:
        assessment = "🟡 WARNING: No visible tumor but classifier detects disease"
        color = "DISAGREEMENT"
    else:
        assessment = "🟢 NORMAL: Both tests indicate healthy"
        color = "BOTH_AGREE"
    
    print("\n  COMBINED ASSESSMENT:")
    print(f"    └─ {assessment}")

# SUMMARY TABLE
print("\n" + "="*80)
print("SUMMARY TABLE")
print("="*80)
print(f"\n{'Image':<25} {'Tumor %':<12} {'Seg Conf':<12} {'Dis Prob':<12} {'Agree?':<15}")
print("-" * 80)

agreements = 0
for filename, result in results:
    seg_detected = result.tumor_area_percentage > 1.0
    clf_detected = result.predicted_class == 1
    agree = "✅ YES" if seg_detected == clf_detected else "❌ NO"
    if seg_detected == clf_detected:
        agreements += 1
    
    print(f"{filename:<25} {result.tumor_area_percentage:>10.2f}% {result.segmentation_confidence:>11.2%} {result.disease_probability:>11.2%} {agree:<15}")

# STATISTICS
print("\n" + "="*80)
print("STATISTICS")
print("="*80)

avg_tumor = sum(r.tumor_area_percentage for _, r in results) / len(results)
avg_seg_conf = sum(r.segmentation_confidence for _, r in results) / len(results)
avg_disease_prob = sum(r.disease_probability for _, r in results) / len(results)
tumor_detected = sum(1 for _, r in results if r.tumor_area_percentage > 1.0)
disease_detected = sum(1 for _, r in results if r.predicted_class == 1)
agreement_rate = (agreements / len(results)) * 100

print(f"\n📊 Segmentation Statistics:")
print(f"  ├─ Average Tumor Area: {avg_tumor:.2f}%")
print(f"  ├─ Average Segmentation Confidence: {avg_seg_conf:.2%}")
print(f"  └─ Images with Tumor: {tumor_detected}/{len(results)}")

print(f"\n📊 Classification Statistics:")
print(f"  ├─ Average Disease Probability: {avg_disease_prob:.2%}")
print(f"  ├─ Disease Detected Cases: {disease_detected}/{len(results)}")
print(f"  └─ Ensemble Agreement Rate: {agreement_rate:.1f}%")

print(f"\n📊 Model Agreement:")
print(f"  ├─ Both agree: {agreements}/{len(results)} ({agreement_rate:.1f}%)")
print(f"  └─ Disagreement: {len(results) - agreements}/{len(results)} ({100-agreement_rate:.1f}%)")

# KEY INSIGHTS
print("\n" + "="*80)
print("KEY INSIGHTS")
print("="*80)

if agreement_rate == 100:
    insight = "✅ Perfect alignment: Segmentation and classification consistently agree"
elif agreement_rate >= 80:
    insight = "✅ Strong agreement: Both methods mostly align"
elif agreement_rate >= 60:
    insight = "⚠️  Moderate agreement: Some discrepancies detected"
else:
    insight = "❌ Low agreement: Models strongly disagree - needs review"

print(f"\n  {insight}")

if avg_disease_prob < 0.01 and avg_tumor < 0.5:
    status = "🟢 HEALTHY: All indicators suggest normal results"
elif avg_disease_prob > 0.5 or avg_tumor > 5.0:
    status = "🔴 CONCERNING: Multiple indicators suggest disease"
else:
    status = "🟡 INCONCLUSIVE: Mixed results - recommend specialist review"

print(f"  {status}")

print("\n" + "="*80)
print("✨ Analysis Complete!")
print("="*80 + "\n")
