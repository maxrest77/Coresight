import os
import nibabel as nib
import numpy as np
import cv2
from tqdm import tqdm

images_path = r"C:\projects\pancrescan\Task07_Pancreas\imagesTr"
labels_path = r"C:\projects\pancrescan\Task07_Pancreas\labelsTr"

out_img = r"C:\projects\pancrescan\data\images"
out_mask = r"C:\projects\pancrescan\data\masks"

os.makedirs(out_img, exist_ok=True)
os.makedirs(out_mask, exist_ok=True)

def normalize(img):
    img = (img - np.min(img)) / (np.max(img) - np.min(img) + 1e-8)
    return (img * 255).astype(np.uint8)

files = os.listdir(images_path)

for file in tqdm(files[:5]):   # first test
    if not file.endswith(".nii.gz") or file.startswith("._"):
        continue

    img_path = os.path.join(images_path, file)
    mask_path = os.path.join(labels_path, file)

    img_nii = nib.load(img_path).get_fdata()
    mask_nii = nib.load(mask_path).get_fdata()

    for i in range(img_nii.shape[2]):
        img_slice = normalize(img_nii[:, :, i])
        mask_slice = mask_nii[:, :, i]

        img_name = f"{file.replace('.nii.gz','')}_{i}.png"

        cv2.imwrite(os.path.join(out_img, img_name), img_slice)

        mask_vis = (mask_slice * 127).astype(np.uint8)
        cv2.imwrite(os.path.join(out_mask, img_name), mask_vis)