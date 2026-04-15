import os
from glob import glob

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'data')
log_path = os.path.join(base_dir, 'verify_log.txt')

with open(log_path, 'w', encoding='utf-8') as f_out:
    def log(msg):
        f_out.write(msg + '\n')
    
    log('--- Dataset Health Check ---')

    # 1. Check STURM-Flood
    sturm_dir = os.path.join(data_dir, 'STURM_Flood_Subset', 'extracted', 'Dataset', 'Sentinel2')
    sturm_imgs = glob(os.path.join(sturm_dir, 'S2', '**', '*.tif'), recursive=True)
    sturm_masks = glob(os.path.join(sturm_dir, 'Floodmaps', '**', '*.tif'), recursive=True)
    log(f'STURM-Flood S2 Images found: {len(sturm_imgs)}')
    log(f'STURM-Flood Masks found: {len(sturm_masks)}')

    # 2. Check HAD-FCDR25
    had_dir = os.path.join(data_dir, 'HAD_FCDR25_Subset', 'extracted')
    had_tifs = glob(os.path.join(had_dir, '**', '*.tif'), recursive=True)
    log(f'HAD-FCDR25 TIFs found: {len(had_tifs)}')

    # 3. Check if any data exists
    if len(sturm_imgs) == 0 and len(had_tifs) == 0:
        log('ERROR: No .tif files found! Extraction might have failed or dataset structure is different.')
    else:
        log('Dataset structure looks intact. Files are present.')

    log('\n--- File Open Test ---')
    # Basic binary open test (to ensure files aren\'t 0 bytes or locked)
    files_to_test = []
    if sturm_imgs: files_to_test.append(sturm_imgs[0])
    if had_tifs: files_to_test.append(had_tifs[0])

    for f in files_to_test:
        try:
            size = os.path.getsize(f)
            with open(f, 'rb') as f_in:
                header = f_in.read(4)
            log(f'SUCCESS: Opened {os.path.basename(f)} (Size: {size/1024/1024:.2f} MB) - valid bytes read')
        except Exception as e:
            log(f'FAILED to open {os.path.basename(f)}: {e}')
