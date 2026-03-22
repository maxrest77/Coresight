import os
import cv2
import torch
import numpy as np
from torch.utils.data import Dataset, DataLoader
import torch.nn as nn

img_dir = r"C:\projects\pancrescan\data\images"
mask_dir = r"C:\projects\pancrescan\data\masks"

IMG_SIZE = 256
BATCH_SIZE = 4
EPOCHS = 20

class PancreasDataset(Dataset):
    def __init__(self):
        self.files = os.listdir(img_dir)

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        file = self.files[idx]

        img = cv2.imread(os.path.join(img_dir, file), 0)
        mask = cv2.imread(os.path.join(mask_dir, file), 0)

        img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
        mask = cv2.resize(mask, (IMG_SIZE, IMG_SIZE))

        img = img / 255.0
        mask = (mask > 0).astype(np.float32)

        img = torch.tensor(img).unsqueeze(0).float()
        mask = torch.tensor(mask).unsqueeze(0).float()

        return img, mask

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

# 🔥 Dice Loss (MAIN FIX)
class DiceLoss(nn.Module):
    def __init__(self):
        super().__init__()

    def forward(self, pred, target):
        pred = torch.sigmoid(pred)
        smooth = 1.0

        intersection = (pred * target).sum()
        union = pred.sum() + target.sum()

        dice = (2. * intersection + smooth) / (union + smooth)
        return 1 - dice

dataset = PancreasDataset()
loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

device = "cuda" if torch.cuda.is_available() else "cpu"

model = UNet().to(device)

optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

# 🔥 Combined Loss
bce = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([6.0]).to(device))
dice = DiceLoss()

def loss_fn(pred, target):
    return bce(pred, target) + dice(pred, target)

for epoch in range(EPOCHS):
    total_loss = 0

    for img, mask in loader:
        img = img.to(device)
        mask = mask.to(device)

        pred = model(img)

        loss = loss_fn(pred, mask)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    print(f"Epoch {epoch+1}, Loss: {total_loss:.4f}")

torch.save(model.state_dict(), "model.pth")
print("Model saved!")