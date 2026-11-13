"""
Create a gentle "offering flowers" sway animation from assets/masha-flowers.png.
Outputs: assets/masha-flowers.gif and assets/masha-flowers-sway.mp4

  pip install pillow numpy imageio imageio-ffmpeg
  python3 scripts/make_flowers_anim.py
"""
import math
import os
from pathlib import Path

import imageio.v2 as imageio
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "masha-flowers.png"
GIF_OUT = ROOT / "assets" / "masha-flowers.gif"
MP4_OUT = ROOT / "assets" / "masha-flowers-sway.mp4"

img = Image.open(SRC).convert("RGB")
max_w = 480
if img.width > max_w:
    ratio = max_w / img.width
    img = img.resize((max_w, int(img.height * ratio)), Image.LANCZOS)

width, height = img.size
frames = []
num_frames = 48

for i in range(num_frames):
    progress = (i / num_frames) * 2 * math.pi
    angle = math.sin(progress) * 2.5
    zoom = 1.04 + (math.sin(progress) * 0.03)
    lift = math.sin(progress) * 6

    rotated = img.rotate(
        angle,
        resample=Image.BICUBIC,
        center=(width // 2, height),
        fillcolor=(12, 42, 36),
    )

    new_w = int(width / zoom)
    new_h = int(height / zoom)
    left = (width - new_w) // 2
    top = max(0, (height - new_h) // 2 - int(lift))
    if top + new_h > height:
        top = height - new_h
    cropped = rotated.crop((left, top, left + new_w, top + new_h))
    frame = cropped.resize((width, height), Image.LANCZOS)
    frames.append(np.array(frame))

imageio.mimsave(GIF_OUT, frames, fps=24, loop=0)
imageio.mimsave(MP4_OUT, frames, fps=24)

print(f"Saved {GIF_OUT.name} ({os.path.getsize(GIF_OUT) / 1024 / 1024:.2f} MB)")
print(f"Saved {MP4_OUT.name} ({os.path.getsize(MP4_OUT) / 1024 / 1024:.2f} MB)")
