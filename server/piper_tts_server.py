"""
Piper TTS HTTP Server for Quick-Einstein ATC Chatter
Loads selected Piper models in memory and streams audio synthesis.
"""

import os
import io
import wave
import sys
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

try:
    from piper import PiperVoice, SynthesisConfig
except ImportError:
    print("[ERROR] piper-tts package not found. Run 'pip install piper-tts'")
    sys.exit(1)

VOICES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'voices'))
PORT = 5005

# Loaded voice instances cache
LOADED_VOICES = {}

def get_voice(voice_name):
    if voice_name in LOADED_VOICES:
        return LOADED_VOICES[voice_name]
    
    onnx_path = os.path.join(VOICES_DIR, f"{voice_name}.onnx")
    if not os.path.exists(onnx_path):
        print(f"[WARN] Voice model file not found: {onnx_path}")
        return None
    
    print(f"[LOAD] Loading Piper model: {voice_name}...")
    try:
        voice = PiperVoice.load(onnx_path)
        LOADED_VOICES[voice_name] = voice
        return voice
    except Exception as e:
        print(f"[ERROR] Failed to load {voice_name}: {e}")
        return None

class PiperHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress default HTTP logging to keep console clean

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            available = [f.replace('.onnx', '') for f in os.listdir(VOICES_DIR) if f.endswith('.onnx') and not f.endswith('.onnx.json')]
            self.wfile.write(json.dumps({"status": "ok", "available_voices": available}).encode('utf-8'))
            return

        if parsed.path == '/synthesize':
            params = parse_qs(parsed.query)
            text = params.get('text', [''])[0]
            voice_name = params.get('voice', ['en_US-arctic-medium'])[0]

            if not text:
                self.send_error(400, "Missing 'text' parameter")
                return

            voice = get_voice(voice_name)
            if not voice:
                self.send_error(404, f"Voice '{voice_name}' model not found in server/voices/")
                return

            try:
                # Synthesize WAV buffer
                buf = io.BytesIO()
                with wave.open(buf, 'wb') as wav_file:
                    voice.synthesize_wav(text, wav_file)
                
                audio_bytes = buf.getvalue()
                self.send_response(200)
                self.send_header('Content-Type', 'audio/wav')
                self.send_header('Content-Length', str(len(audio_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(audio_bytes)
            except Exception as e:
                print(f"[ERROR] Synthesis failed for '{text}': {e}")
                self.send_error(500, str(e))
            return

        self.send_error(404, "Endpoint not found")

def run_server():
    os.makedirs(VOICES_DIR, exist_ok=True)
    server = HTTPServer(('127.0.0.1', PORT), PiperHandler)
    print(f"[PIPER TTS] Server running on http://127.0.0.1:{PORT}")
    print(f"[PIPER TTS] Voice models path: {VOICES_DIR}")
    server.serve_forever()

if __name__ == '__main__':
    run_server()
