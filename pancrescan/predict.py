import os
import cv2
import torch
import numpy as np
import matplotlib.pyplot as plt
import torch.nn as nn

IMG_SIZE = 256

# 🔹 MODEL (same as training)
class DoubleConv(nn.Module):
    def __init__(self, in_c, out_c):
        super().__init__()
        self.seq = nn.Sequential(
            nn.Conv2d(in_c, out_c, 3, padding=1),
            nn.BatchNorm2d(out_c),
            nn.ReLU(),
            nn.Conv2d(out_c, out_c, 3, padding=1),
            nn.BatchNorm2d(out_c),
            nn.ReLU()
        )

    def forward(self, x):
        return self.seq(x)

class UNet(nn.Module):
    def __init__(self):
        super().__init__()

        self.d1 = DoubleConv(1, 64)
        self.d2 = DoubleConv(64, 128)
        self.d3 = DoubleConv(128, 256)

        self.pool = nn.MaxPool2d(2)

        self.u1 = DoubleConv(256 + 128, 128)
        self.u2 = DoubleConv(128 + 64, 64)

        self.up = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True)

        self.out = nn.Conv2d(64, 1, 1)

    def forward(self, x):
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

# 🔹 Load model
model = UNet()
model.load_state_dict(torch.load("model.pth", map_location="cpu"))
model.eval()

# 🔹 Pick image automatically
img_dir = r"C:\projects\pancrescan\data\images"
files = os.listdir(img_dir)

if len(files) == 0:
    raise ValueError("No images found!")

img_path = os.path.join(img_dir, files[0])
print("Using image:", img_path)

# 🔹 Load image safely
img = cv2.imread(img_path, 0)
if img is None:
    raise ValueError(f"Failed to load image: {img_path}")

orig = cv2.resize(img, (IMG_SIZE, IMG_SIZE))

# 🔹 Preprocess
img_input = orig / 255.0
img_input = torch.tensor(img_input).unsqueeze(0).unsqueeze(0).float()

# 🔹 Predict
with torch.no_grad():
    pred = model(img_input)
    pred = torch.sigmoid(pred).squeeze().numpy()

pred_mask = (pred > 0.5).astype(np.uint8)

# 🔥 POST-PROCESSING (remove noise)
kernel = np.ones((3,3), np.uint8)
pred_mask = cv2.morphologyEx(pred_mask, cv2.MORPH_OPEN, kernel)

num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(pred_mask)

if num_labels > 1:
    largest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    pred_mask = (labels == largest).astype(np.uint8)

# 🔥 AREA CALCULATION
area = np.sum(pred_mask) / pred_mask.size
print("Tumor area %:", round(area, 4))

# 🔥 RED OVERLAY
orig_color = cv2.cvtColor(orig, cv2.COLOR_GRAY2BGR)
overlay = orig_color.copy()

overlay[pred_mask == 1] = [0, 0, 255]  # red
overlay = cv2.addWeighted(orig_color, 0.7, overlay, 0.3, 0)

# 🔹 Show results
plt.figure(figsize=(10,4))

plt.subplot(1,3,1)
plt.title("Original")
plt.imshow(orig, cmap="gray")
plt.axis('off')

plt.subplot(1,3,2)
plt.title("Prediction")
plt.imshow(pred_mask, cmap="gray")
plt.axis('off')

plt.subplot(1,3,3)
plt.title("Overlay")
plt.imshow(overlay)
plt.axis('off')

plt.show()