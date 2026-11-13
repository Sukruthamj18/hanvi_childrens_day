"""Bake portrait clips into 1280x720 with full characters visible + soft fantasy sides."""
from __future__ import annotations

import math
import random
from pathlib import Path

import imageio.v2 as imageio
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUT_W, OUT_H = 1280, 720


def cover_resize(img: Image.Image, tw: int, th: int) -> Image.Image:
    img = img.convert("RGB")
    w, h = img.size
    scale = max(tw / w, th / h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return img.crop((left, top, left + tw, top + th))


def fit_height(img: Image.Image, th: int) -> Image.Image:
    """Keep full subject visible — scale to frame height (no extreme zoom crop)."""
    img = img.convert("RGB")
    w, h = img.size
    scale = th / h
    nw = max(1, int(w * scale))
    return img.resize((nw, th), Image.Resampling.LANCZOS)


def fantasy_dust(frame_i: int) -> Image.Image:
    layer = Image.new("RGBA", (OUT_W, OUT_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    rng = random.Random(50 + frame_i // 3)
    for _ in range(18):
        x = rng.randint(0, OUT_W)
        y = rng.randint(0, OUT_H)
        if OUT_W * 0.3 < x < OUT_W * 0.7:
            continue
        r = rng.randint(24, 80)
        color = rng.choice(
            [
                (255, 210, 140, 28),
                (255, 160, 200, 22),
                (160, 240, 200, 20),
            ]
        )
        draw.ellipse((x - r, y - r, x + r, y + r), fill=color)
    for _ in range(14):
        x = rng.randint(10, OUT_W - 10)
        y = rng.randint(10, OUT_H - 10)
        if OUT_W * 0.32 < x < OUT_W * 0.68:
            continue
        s = rng.randint(1, 3)
        a = 110 + int(80 * abs(math.sin((frame_i + x) * 0.1)))
        draw.ellipse((x - s, y - s, x + s, y + s), fill=(255, 250, 220, a))
    return layer


def compose(raw: np.ndarray, frame_i: int) -> np.ndarray:
    src = Image.fromarray(raw).convert("RGB")

    bg = cover_resize(src, OUT_W, OUT_H)
    bg = ImageEnhance.Color(bg).enhance(1.3)
    bg = ImageEnhance.Brightness(bg).enhance(0.8)
    bg = bg.filter(ImageFilter.GaussianBlur(24))
    tint = Image.new("RGBA", (OUT_W, OUT_H), (30, 55, 48, 40))
    canvas = Image.alpha_composite(bg.convert("RGBA"), tint)

    fg = fit_height(src, OUT_H)
    # If somehow wider than canvas, crop center
    if fg.width > OUT_W:
        left = (fg.width - OUT_W) // 2
        fg = fg.crop((left, 0, left + OUT_W, OUT_H))
    x = (OUT_W - fg.width) // 2
    canvas.paste(fg.convert("RGBA"), (x, 0))
    canvas = Image.alpha_composite(canvas, fantasy_dust(frame_i))
    return np.asarray(canvas.convert("RGB"))


def bake(src: Path, dst: Path, min_seconds: float = 8.0) -> None:
    reader = imageio.get_reader(src)
    meta = reader.get_meta_data()
    fps = float(meta.get("fps") or 24)
    duration = meta.get("duration")
    nframes = meta.get("nframes")
    try:
        n_src = int(nframes) if nframes and math.isfinite(float(nframes)) else 0
    except (TypeError, ValueError, OverflowError):
        n_src = 0
    if n_src <= 0 and duration and math.isfinite(float(duration)):
        n_src = max(1, int(float(duration) * fps))
    if n_src <= 0:
        n_src = sum(1 for _ in reader)
        reader.close()
        reader = imageio.get_reader(src)

    target = max(n_src, int(fps * min_seconds))
    dst.parent.mkdir(parents=True, exist_ok=True)
    tmp = dst.with_suffix(".tmp.mp4")
    writer = imageio.get_writer(
        tmp,
        fps=fps,
        codec="libx264",
        quality=7,
        pixelformat="yuv420p",
        macro_block_size=1,
    )

    written = 0
    try:
        while written < target:
            for raw in reader:
                writer.append_data(compose(raw, written))
                written += 1
                if written % 40 == 0:
                    print(f"  {dst.name}: {written}/{target}")
                if written >= target:
                    break
            reader.close()
            if written < target:
                reader = imageio.get_reader(src)
    finally:
        writer.close()
        try:
            reader.close()
        except Exception:
            pass

    tmp.replace(dst)
    print(f"Wrote {dst} ({OUT_W}x{OUT_H}, {written} frames @ {fps}fps)")


def main() -> None:
    jobs = [
        (ASSETS / "masha-flowers.mp4", ASSETS / "masha-flowers-wide.mp4"),
        (ASSETS / "masha-fight-sway.mp4", ASSETS / "masha-fight-wide.mp4"),
    ]
    for src, dst in jobs:
        if not src.exists():
            print(f"Skip missing {src}")
            continue
        print(f"Baking {src.name} → {dst.name}")
        bake(src, dst)


if __name__ == "__main__":
    main()
