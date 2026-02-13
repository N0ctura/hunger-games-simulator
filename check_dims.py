import requests
from PIL import Image
from io import BytesIO

def check_url(url):
    try:
        r = requests.get(url)
        if r.status_code == 200:
            i = Image.open(BytesIO(r.content))
            print(f"{url}: {i.size} Mode={i.mode}")
        else:
            print(f"{url}: Failed {r.status_code}")
    except Exception as e:
        print(f"{url}: Error {e}")

check_url('https://cdn.wolvesville.com/avatarItems/body.png')
# Try to find a valid item ID from a common list or guess
# Common IDs often look like UUIDs, but let's try a known one if possible.
# If I can't find one, body.png is the most critical one for aspect ratio.
