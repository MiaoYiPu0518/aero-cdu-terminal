import os
import wave
import math
import struct
import random

out_dir = r"c:\Users\CaoYe\Documents\antigravity\quick-einstein\public\sounds"
os.makedirs(out_dir, exist_ok=True)
sample_rate = 44100
math_pi = math.pi

def write_wav(filename, samples):
    filepath = os.path.join(out_dir, filename)
    with wave.open(filepath, 'w') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2) # 16-bit
        wav.setframerate(sample_rate)
        packed = bytearray()
        for s in samples:
            val = max(-32768, min(32767, int(s * 32767.0)))
            packed.extend(struct.pack('<h', val))
        wav.writeframes(packed)
    print(f"Generated {filename} ({len(samples)} samples)")

# 1. Altitude Chime (1050 Hz bell chime with smooth exponential decay)
samples_alt = []
for i in range(int(sample_rate * 0.75)):
    t = i / sample_rate
    env = math.exp(-6.0 * t)
    s = (math.sin(2 * math_pi * 1050 * t) * 0.7 + math.sin(2 * math_pi * 2100 * t) * 0.25) * env
    samples_alt.append(s)
write_wav("altitude_chime.wav", samples_alt)

# 2. Master Caution Chime (Double chime 850 Hz)
samples_caution = []
for i in range(int(sample_rate * 0.8)):
    t = i / sample_rate
    env1 = math.exp(-9.0 * t) if t < 0.3 else 0
    env2 = math.exp(-9.0 * (t - 0.22)) if t >= 0.22 else 0
    s1 = math.sin(2 * math_pi * 850 * t) * env1
    s2 = math.sin(2 * math_pi * 850 * (t - 0.22)) * env2
    samples_caution.append((s1 + s2) * 0.75)
write_wav("master_caution.wav", samples_caution)

# 3. TCAS Warning Alert (Alternating 800Hz / 1000Hz alert pulses)
samples_tcas = []
for i in range(int(sample_rate * 1.2)):
    t = i / sample_rate
    freq = 1000 if (int(t * 8) % 2 == 0) else 800
    pulse_env = 0.85 if (t % 0.25 < 0.2) else 0.0
    s = math.sin(2 * math_pi * freq * t) * pulse_env
    samples_tcas.append(s * 0.7)
write_wav("tcas_warning.wav", samples_tcas)

# 4. Gear Clunk (Low frequency thud 80Hz + metallic resonance 280Hz)
samples_gear = []
for i in range(int(sample_rate * 0.5)):
    t = i / sample_rate
    env_thud = math.exp(-15.0 * t)
    env_metal = math.exp(-22.0 * t)
    thud = math.sin(2 * math_pi * 80 * t) * env_thud
    metal = math.sin(2 * math_pi * 280 * t) * env_metal
    samples_gear.append((thud * 0.7 + metal * 0.4))
write_wav("gear_clunk.wav", samples_gear)

# 5. Touchdown Tire Chirp (Filtered screech noise + 1800Hz chirp)
samples_touchdown = []
for i in range(int(sample_rate * 0.35)):
    t = i / sample_rate
    env = math.exp(-14.0 * t)
    noise = (random.random() * 2.0 - 1.0) * env * 0.4
    chirp = math.sin(2 * math_pi * (2200 - t * 4000) * t) * env * 0.5
    samples_touchdown.append(noise + chirp)
write_wav("touchdown_chirp.wav", samples_touchdown)

# 6. Overspeed Warning Klaxon (Pulsing 950Hz warning tone)
samples_overspeed = []
for i in range(int(sample_rate * 1.0)):
    t = i / sample_rate
    pulse = 1.0 if (int(t * 6) % 2 == 0) else 0.0
    s = (math.sin(2 * math_pi * 950 * t) + 0.3 * math.sin(2 * math_pi * 1900 * t)) * pulse * 0.6
    samples_overspeed.append(s)
write_wav("overspeed_warn.wav", samples_overspeed)

print("All cockpit audio sound assets generated successfully!")
