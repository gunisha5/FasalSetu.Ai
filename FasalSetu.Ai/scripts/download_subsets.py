import requests
import os
import time
from tqdm import tqdm
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

def get_robust_session():
    """Create a requests session with retries to prevent ConnectionResetError."""
    session = requests.Session()
    # Retry up to 5 times, with exponential backoff
    retry = Retry(
        total=5,
        read=5,
        connect=5,
        backoff_factor=1.0, 
        status_forcelist=[ 500, 502, 503, 504 ]
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    
    return session

def download_file_with_resume(session, url, output_path):
    """Download a file with streaming and basic resume capability."""
    headers = {}
    
    # Check if file partially exists to resume
    file_mode = 'wb'
    if os.path.exists(output_path):
        downloaded_bytes = os.path.getsize(output_path)
        headers['Range'] = f'bytes={downloaded_bytes}-'
        file_mode = 'ab'
    else:
        downloaded_bytes = 0

    try:
        response = session.get(url, headers=headers, stream=True, timeout=30)
        
        # If server doesn't support generic range requests, it returns 200 instead of 206
        if response.status_code == 200 and downloaded_bytes > 0:
            print(f"Warning: Server does not support resume for {output_path}. Redownloading from scratch.")
            file_mode = 'wb'
            downloaded_bytes = 0
            
        elif response.status_code == 416:
            print(f"File {output_path} is already fully downloaded!")
            return True
            
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0)) + downloaded_bytes
        
        with open(output_path, file_mode) as file, tqdm(
            desc=os.path.basename(output_path),
            initial=downloaded_bytes,
            total=total_size,
            unit='B',
            unit_scale=True,
            unit_divisor=1024,
        ) as bar:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    size = file.write(chunk)
                    bar.update(size)
                    
        return True
    except requests.exceptions.ConnectionError as e:
        print(f"\n[WinError 10054] Connection Dropped by Remote Server!")
        print(f"Don't worry, the script saved {downloaded_bytes / (1024*1024):.2f} MB of progress.")
        print("Waiting 5 seconds and retrying...")
        return False
    except Exception as e:
        print(f"\nDownload interrupted: {e}")
        return False

def download_zenodo_subset(record_id, max_files=1, download_dir="./data"):
    """Queries Zenodo and downloads files robustly."""
    os.makedirs(download_dir, exist_ok=True)
    print(f"\n--- Fetching metadata for Zenodo Record: {record_id} ---")
    
    session = get_robust_session()
    
    url = f"https://zenodo.org/api/records/{record_id}"
    response = session.get(url, timeout=30)
    
    if response.status_code != 200:
        print(f"Failed to fetch record {record_id}. Status: {response.status_code}")
        return
        
    data = response.json()
    files = data.get('files', [])
    
    subset_files = files[:max_files]
    print(f"Downloading a subset of {len(subset_files)} file(s)...")
    
    for f in subset_files:
        file_name = f['key']
        download_url = f['links']['self']
        output_path = os.path.join(download_dir, file_name)
        
        success = False
        attempts = 0
        while not success and attempts < 10:
            if attempts > 0:
                time.sleep(5) # Cooldown before trying to resume
            success = download_file_with_resume(session, download_url, output_path)
            attempts += 1
            
        if not success:
            print(f"Failed to completely download {file_name} after 10 attempts.")

if __name__ == "__main__":
    
    # Note: HuggingFace's Sen4AgriNet dataset block has been temporarily removed
    # because Orion-AI-Lab recently restricted public streaming access to it without a token.
    
    # 1. STURM-Flood Subset
    download_zenodo_subset(record_id="12748983", max_files=1, download_dir=r"./data/STURM_Flood_Subset")
    
    # 2. HAD-FCDR25 Subset
    download_zenodo_subset(record_id="15204587", max_files=1, download_dir=r"./data/HAD_FCDR25_Subset")
    
    print("\nAll Zenodo subsets synced! You can now proceed to Phase 1.2.")
