import os
import cv2

img_dir = r"C:\projects\pancrescan\data\images"
mask_dir = r"C:\projects\pancrescan\data\masks"

removed = 0
kept = 0

for file in os.listdir(mask_dir):
    mask_path = os.path.join(mask_dir, file)
    img_path = os.path.join(img_dir, file)

    mask = cv2.imread(mask_path, 0)

    if mask is None:
        continue

    if mask.max() == 0:
        os.remove(mask_path)
        if os.path.exists(img_path):
            os.remove(img_path)
        removed += 1
    else:
        kept += 1

print("Removed:", removed)
print("Kept:", kept)