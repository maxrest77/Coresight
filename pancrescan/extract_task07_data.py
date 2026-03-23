import os
import glob
import numpy as np
import nibabel as nib
import cv2
from tqdm import tqdm

def extract_pancreas_slices():
    """
    Extracts exactly the slices where the pancreas mask is visible from the massive NIfTI 
    3D Medical Arrays. Saves strictly the 2D matrices as perfectly paired PNGs.
    """
    images_dir = r"c:\projects\CoreSight\pancrescan\Task07_Pancreas\imagesTr"
    labels_dir = r"c:\projects\CoreSight\pancrescan\Task07_Pancreas\labelsTr"
    
    out_img_dir = r"c:\projects\CoreSight\pancrescan\data\images"
    out_mask_dir = r"c:\projects\CoreSight\pancrescan\data\masks"
    
    os.makedirs(out_img_dir, exist_ok=True)
    os.makedirs(out_mask_dir, exist_ok=True)
    
    if not os.path.exists(labels_dir):
        print(f"CRITICAL ERROR: {labels_dir} does not exist!")
        print("You must drop the downloaded 'labelsTr' folder next to 'imagesTr' before running this script.")
        return
        
    image_files = sorted(glob.glob(os.path.join(images_dir, "*.nii.gz")))
    
    # Strictly process the first 15 patients
    process_limit = 15
    image_files = image_files[:process_limit]
    
    print(f"Found {len(image_files)} patient volumes. Beginning localized slice extraction...")
    
    total_extracted = 0
    for img_path in tqdm(image_files, desc="Processing NIfTI Patients"):
        basename = os.path.basename(img_path)
        label_path = os.path.join(labels_dir, basename)
        
        if not os.path.exists(label_path):
            print(f"Skipping {basename} - no matching label volume found in {labels_dir}.")
            continue
            
        try:
            img_vol = nib.load(img_path).get_fdata()
            mask_vol = nib.load(label_path).get_fdata()
        except Exception as e:
            print(f"Failed to load NIfTI array for {basename}: {e}")
            continue
        
        patient_id = basename.split('.')[0]  # e.g., pancreas_001

        # --- Positive slices: where pancreas IS visible ---
        positive_indices = [i for i in range(img_vol.shape[2]) if np.sum(mask_vol[:, :, i]) > 0]

        # --- Negative slices: where pancreas is NOT visible ---
        # Pick slices evenly spread away from the positive range to get true abdominal context
        negative_indices_all = [i for i in range(img_vol.shape[2]) if np.sum(mask_vol[:, :, i]) == 0]
        # Sample up to 15 negatives per patient (match ~positive count) spread uniformly
        neg_sample_count = min(15, len(positive_indices), len(negative_indices_all))
        if neg_sample_count > 0 and negative_indices_all:
            step = max(1, len(negative_indices_all) // neg_sample_count)
            negative_indices = negative_indices_all[::step][:neg_sample_count]
        else:
            negative_indices = []

        all_indices = [(idx, True) for idx in positive_indices] + [(idx, False) for idx in negative_indices]

        for slice_idx, is_positive in all_indices:
            img_slice = img_vol[:, :, slice_idx]
            mask_slice = mask_vol[:, :, slice_idx]

            # Soft-Tissue CT Windowing
            vmin, vmax = -100, 240
            img_slice = np.clip(img_slice, vmin, vmax)
            img_slice = (img_slice - vmin) / (vmax - vmin) * 255.0
            img_slice = img_slice.astype(np.uint8)

            # Binary mask (0 for empty, 255 for pancreas/tumor)
            mask_slice_binary = np.where(mask_slice > 0, 255, 0).astype(np.uint8)

            # Fix NIfTI 90-degree rotation
            img_slice = np.rot90(img_slice)
            mask_slice_binary = np.rot90(mask_slice_binary)

            label = "pos" if is_positive else "neg"
            slice_filename = f"{patient_id}_{slice_idx:03d}_{label}.png"

            cv2.imwrite(os.path.join(out_img_dir, slice_filename), img_slice)
            cv2.imwrite(os.path.join(out_mask_dir, slice_filename), mask_slice_binary)

            total_extracted += 1
                
    print(f"\nExtraction Complete! Mathematically isolated and exported {total_extracted} exact pancreas slice pairings.")

if __name__ == '__main__':
    extract_pancreas_slices()
