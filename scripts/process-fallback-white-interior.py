#!/usr/bin/env python3
"""
Regenerate Stories + Arts category fallbacks with clean transparency.

These clay assets have near-white page/canvas faces. A studio-white flood-fill
knockout (see process-fallback-images.mjs) connects through anti-aliased edges
and erases interiors + puddle highlights.

Approach: rembg matte, then restore blue puddles / yellow accents rembg drops.

Requires: pip install rembg onnxruntime pillow
Run from repo root:
  python3 scripts/process-fallback-white-interior.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

try:
    from rembg import remove
except ImportError:
    print("Install rembg first: pip3 install rembg onnxruntime", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT.parent / ".cursor" / "projects" / "Users-schei-puddles-v2" / "assets"
OUT = ROOT / "public" / "event-fallbacks"

JOBS = [
    ("Stories-7641664f-9fea-4691-96df-c0d5e0c8dc5a.png", "stories.png"),
    ("Art___Crafts-42007422-2c79-4812-a3a9-b4bf95c04083.png", "arts.png"),
]


def is_clay_accent(r: int, g: int, b: int) -> bool:
    """Puddle blues, sparkle lines, yellow star — rembg often drops these."""
    if b > 155 and b >= r + 8 and b >= g + 2:
        return True
    if b > 190 and g > 170 and r > 140 and b > r and b > g - 5 and max(r, g, b) - min(r, g, b) >= 8:
        return True
    if r > 200 and g > 170 and b < 120 and r - b > 80:
        return True
    if 40 < r < 160 and 80 < g < 200 and b > 150 and b > r + 30:
        return True
    return False


def process(src_name: str, dst_name: str) -> None:
    src = ASSETS / src_name
    if not src.exists():
        raise FileNotFoundError(src)

    img = Image.open(src).convert("RGB")
    w, h = img.size
    draw = ImageDraw.Draw(img)
    # Cover "puddles" watermark pill
    draw.rounded_rectangle([0, 0, int(w * 0.26), int(h * 0.11)], radius=28, fill=(255, 255, 255))

    rem = remove(img).convert("RGBA")
    if rem.size != img.size:
        rem = rem.resize(img.size, Image.Resampling.LANCZOS)

    accent = Image.new("L", img.size, 0)
    ap = accent.load()
    op = img.load()
    for y in range(h):
        for x in range(w):
            if is_clay_accent(*op[x, y]):
                ap[x, y] = 255
    accent = accent.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3))
    ap = accent.load()

    out = rem.copy()
    px = out.load()
    restored = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 200 and ap[x, y] > 128:
                or_, og, ob = op[x, y]
                if max(or_, og, ob) - min(or_, og, ob) <= 12 and max(or_, og, ob) >= 247:
                    continue
                px[x, y] = (or_, og, ob, 255)
                restored += 1

    max_dim = 800
    if max(out.size) > max_dim:
        ratio = max_dim / max(out.size)
        out = out.resize(
            (int(out.size[0] * ratio), int(out.size[1] * ratio)),
            Image.Resampling.LANCZOS,
        )

    OUT.mkdir(parents=True, exist_ok=True)
    dst = OUT / dst_name
    out.save(dst, format="PNG", optimize=True)
    print(f"✓ {dst_name} (restored {restored} accent px) → {dst}")


def main() -> None:
    if not ASSETS.is_dir():
        print(f"Assets folder not found: {ASSETS}", file=sys.stderr)
        sys.exit(1)
    for src_name, dst_name in JOBS:
        process(src_name, dst_name)


if __name__ == "__main__":
    main()
