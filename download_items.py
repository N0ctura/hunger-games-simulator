
import json
import os
import time
import requests
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configuration
ITEMS_FILE = "items.json"
FALLBACK_ITEMS_FILE = "src/data/all-avatar-items.json"
OUTPUT_DIR = "public/assets/items"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
MAX_WORKERS = 30
SUBMISSION_DELAY = 0.05  # Delay between submitting tasks
TIMEOUT = 30
MAX_RETRIES = 3

def download_single_item(item, output_dir, headers):
    item_id = item.get('id')
    image_url = item.get('imageUrl')

    if not item_id:
        return 'skipped_no_id'
    
    # Some items might have "color:..." as imageUrl (e.g. skins), skip those if not downloadable
    if not image_url or not image_url.startswith("http"):
        return 'skipped_invalid_url'

    file_name = f"{item_id}.png"
    file_path = os.path.join(output_dir, file_name)

    # Note: Existence check is done in main loop for efficiency, 
    # but we might double check here or handle re-downloads.
    # If we are here, it means we need to download.

    for attempt in range(MAX_RETRIES):
        try:
            response = requests.get(image_url, headers=headers, timeout=TIMEOUT)
            if response.status_code == 200:
                with open(file_path, 'wb') as f:
                    f.write(response.content)
                print(f"Downloaded: {file_name}")
                return 'success'
            else:
                print(f"Failed {item_id} (Status {response.status_code})")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(2)
        except Exception as e:
            print(f"Error {item_id}: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(2)
    
    return 'error'

def main():
    # 1. Read JSON file
    file_path = ITEMS_FILE
    if not os.path.exists(file_path):
        if os.path.exists(FALLBACK_ITEMS_FILE):
            print(f"'{ITEMS_FILE}' not found. Using '{FALLBACK_ITEMS_FILE}' instead.")
            file_path = FALLBACK_ITEMS_FILE
        else:
            print(f"Error: Neither '{ITEMS_FILE}' nor '{FALLBACK_ITEMS_FILE}' found.")
            sys.exit(1)

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            items = json.load(f)
    except Exception as e:
        print(f"Error reading JSON file: {e}")
        sys.exit(1)

    if not isinstance(items, list):
        print("Error: JSON content is not a list.")
        sys.exit(1)

    total_items = len(items)
    print(f"Found {total_items} items to process.")

    # 2. Create output directory
    if not os.path.exists(OUTPUT_DIR):
        try:
            os.makedirs(OUTPUT_DIR)
            print(f"Created directory: {OUTPUT_DIR}")
        except Exception as e:
            print(f"Error creating directory: {e}")
            sys.exit(1)

    headers = {
        "User-Agent": USER_AGENT
    }

    # Counters
    stats = {
        'success': 0,
        'skipped': 0,
        'error': 0,
        'submitted': 0
    }

    # We use a list to keep track of futures if we want to wait for them
    futures = []

    print(f"Starting download with {MAX_WORKERS} workers...")

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        for index, item in enumerate(items):
            item_id = item.get('id')
            
            # Basic validation
            if not item_id:
                continue

            file_name = f"{item_id}.png"
            file_path = os.path.join(OUTPUT_DIR, file_name)

            # Fast existence check in main thread
            if os.path.exists(file_path):
                if os.path.getsize(file_path) > 100:
                    stats['skipped'] += 1
                    if stats['skipped'] % 100 == 0:
                        print(f"Checked {index + 1}/{total_items} (Skipped {stats['skipped']} existing)...", end='\r')
                    continue
                else:
                    print(f"Found corrupted/small file for {item_id}, re-downloading...")
            
            # Submit task
            future = executor.submit(download_single_item, item, OUTPUT_DIR, headers)
            futures.append(future)
            stats['submitted'] += 1
            
            # Rate limiting for submission
            time.sleep(SUBMISSION_DELAY)

    # Wait for all futures to complete (ThreadPoolExecutor context manager does this, but we can iterate to count results)
    # Since we appended to futures list, we can check their results now or rely on the prints in the thread.
    # To be accurate with stats, we should process results.
    
    print("\nWaiting for remaining downloads to complete...")
    
    for future in as_completed(futures):
        result = future.result()
        if result == 'success':
            stats['success'] += 1
        elif result == 'error':
            stats['error'] += 1
        # skipped inside worker (e.g. invalid url) is not counted in 'skipped' (which is for existing files)
        # but we can add another counter if needed.

    print(f"\nDownload complete.")
    print(f"Success: {stats['success']}")
    print(f"Skipped (Existing): {stats['skipped']}")
    print(f"Errors: {stats['error']}")

if __name__ == "__main__":
    main()
