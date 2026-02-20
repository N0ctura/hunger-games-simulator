import os

DIR = "public/assets/items"

def check_files():
    if not os.path.exists(DIR):
        print(f"Directory {DIR} does not exist.")
        return

    files = os.listdir(DIR)
    if not files:
        print(f"No files in {DIR}")
        return

    print(f"Checking {len(files)} files in {DIR}...")
    
    for filename in files[:5]: # Check first 5 files
        path = os.path.join(DIR, filename)
        try:
            with open(path, "rb") as f:
                header = f.read(8)
                content_start = f.read(100) # Read a bit more to see text content if any
            
            print(f"\nFile: {filename}")
            print(f"Size: {os.path.getsize(path)} bytes")
            print(f"Header (hex): {header.hex()}")
            
            # Check for PNG signature
            if header == b'\x89PNG\r\n\x1a\n':
                print("Status: Valid PNG signature")
            else:
                print("Status: INVALID PNG signature")
                try:
                    # Try to decode as text to see if it's an error message
                    text = (header + content_start).decode('utf-8', errors='ignore')
                    print(f"Content preview: {text[:100]}")
                except:
                    pass
        except Exception as e:
            print(f"Error reading {filename}: {e}")

if __name__ == "__main__":
    check_files()
