import cv2
import os
import numpy as np

def inject_negative_backgrounds():
    src_dir = r"c:\projects\CoreSight\DATASET\train\train\normal"
    out_img_dir = r"c:\projects\CoreSight\pancrescan\data\images"
    out_mask_dir = r"c:\projects\CoreSight\pancrescan\data\masks"

    os.makedirs(out_img_dir, exist_ok=True)
    os.makedirs(out_mask_dir, exist_ok=True)

    count = 0
    # Inject exactly 1-001.jpg to 1-035.jpg as user requested
    for i in range(1, 36):
        filename = f"1-{i:03d}.jpg"
        src_path = os.path.join(src_dir, filename)
        
        if os.path.exists(src_path):
            img = cv2.imread(src_path)
            if img is None: continue
            
            # The UNet expects exact matching .png filenames for Image and Mask
            png_filename = f"neg_bg_1_{i:03d}.png"
            img_out_path = os.path.join(out_img_dir, png_filename)
            mask_out_path = os.path.join(out_mask_dir, png_filename)
            
            # Save the raw chest/kidney CT slice
            cv2.imwrite(img_out_path, img)
            
            # Create a 100% mathematically empty binary mask (label 0)
            blank_mask = np.zeros(img.shape[:2], dtype=np.uint8)
            cv2.imwrite(mask_out_path, blank_mask)
            count += 1

    print(f"🔥 Successfully injected {count} pure negative background pairs into the UNet Dataset!")

if __name__ == '__main__':
    inject_negative_backgrounds()
