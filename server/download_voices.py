import os
import sys
import requests

voices_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'voices'))
os.makedirs(voices_dir, exist_ok=True)

models = [
    ('en_GB-alan-medium', 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/medium/en_GB-alan-medium'),
    ('en_US-arctic-medium', 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/arctic/medium/en_US-arctic-medium'),
    ('en_US-danny-medium', 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/danny/medium/en_US-danny-medium'),
    ('en_US-l2arctic-medium', 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/l2arctic/medium/en_US-l2arctic-medium'),
    ('en_GB-vctk-medium', 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/vctk/medium/en_GB-vctk-medium')
]

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
})

print(f"Downloading Piper voice models to: {voices_dir}")

for name, base_url in models:
    for ext in ['.onnx', '.onnx.json']:
        filename = name + ext
        target_path = os.path.join(voices_dir, filename)
        
        if os.path.exists(target_path) and os.path.getsize(target_path) > 1000:
            print(f" [SKIP] {filename} already exists ({os.path.getsize(target_path)} bytes)")
            continue
            
        url = base_url + ext
        print(f" [DOWNLOADING] {filename}...")
        try:
            r = session.get(url, allow_redirects=True, stream=True)
            r.raise_for_status()
            with open(target_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=65536):
                    f.write(chunk)
            print(f" [SUCCESS] Saved {filename} ({os.path.getsize(target_path)} bytes)")
        except Exception as e:
            print(f" [ERROR] Failed downloading {filename}: {e}")

print("Done processing Piper voice models.")
