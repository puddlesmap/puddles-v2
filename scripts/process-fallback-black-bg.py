#!/usr/bin/env python3
"""
Regenerate Festivals & Community + Parent & Me fallbacks with transparency.

Source clay assets ship on pure black. Knock that to alpha — do NOT composite
onto black/dark when saving. Output is RGBA PNG with transparent corners.

Run from repo root:
  python3 scripts/process-fallback-black-bg.py
"""

from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT.parent / ".cursor" / "projects" / "Users-schei-puddles-v2" / "assets"
OUT = ROOT / "public" / "event-fallbacks"

JOBS = [
    ("Festival___Community-f8873c91-d3df-476f-93ed-ee299cecfb27.png", "festivals.png"),
    ("Parent_me-dc8b669c-1603-468c-bb06-8ec953ea4943.png", "parent-me.png"),
]


def is_studio(r: int, g: int, b: int, hard: int = 42) -> bool:
    mx, mn = max(r, g, b), min(r, g, b)
    if mx - mn > 24:
        return False
    return mx <= hard


def halo_cleanup(px, w: int, h: int) -> None:
    """Drop opaque neutral-dark pixels touching transparency (shadow ring)."""
    for _ in range(6):
        to_clear: list[tuple[int, int]] = []
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a < 200:
                    continue
                mx, mn = max(r, g, b), min(r, g, b)
                if mx > 72 or mx - mn > 28:
                    continue
                if any(
                    0 <= x + dx < w
                    and 0 <= y + dy < h
                    and px[x + dx, y + dy][3] < 128
                    for dx, dy in (
                        (1, 0),
                        (-1, 0),
                        (0, 1),
                        (0, -1),
                        (2, 0),
                        (-2, 0),
                        (0, 2),
                        (0, -2),
                    )
                ):
                    to_clear.append((x, y))
        if not to_clear:
            break
        for x, y in to_clear:
            px[x, y] = (0, 0, 0, 0)


def trim_pad(img: Image.Image, pad_ratio: float = 0.06) -> Image.Image:
    px = img.load()
    w, h = img.size
    minx, miny, maxx, maxy = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 16:
                minx = min(minx, x)
                maxx = max(maxx, x)
                miny = min(miny, y)
                maxy = max(maxy, y)
    if maxx < minx:
        return img
    pw, ph = maxx - minx + 1, maxy - miny + 1
    pad = max(int(max(pw, ph) * pad_ratio), 8)
    crop = img.crop(
        (
            max(0, minx - pad),
            max(0, miny - pad),
            min(w, maxx + 1 + pad),
            min(h, maxy + 1 + pad),
        )
    )
    cw = ch = max(crop.size)
    out = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    ox = (cw - crop.size[0]) // 2
    oy = (ch - crop.size[1]) // 2
    out.paste(crop, (ox, oy), crop)
    return out


def knock_black_bg(src: Path, dst: Path, hard: int = 42) -> None:
    img = Image.open(src).convert("RGBA")
    w, h = img.size
    px = img.load()

    visited: set[tuple[int, int]] = set()
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_studio(*px[x, y][:3], hard):
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_studio(*px[x, y][:3], hard):
                q.append((x, y))

    while q:
        x, y = q.popleft()
        if not (0 <= x < w and 0 <= y < h) or (x, y) in visited:
            continue
        visited.add((x, y))
        r, g, b, _ = px[x, y]
        if not is_studio(r, g, b, hard):
            continue
        px[x, y] = (r, g, b, 0)
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a and is_studio(r, g, b, hard):
                px[x, y] = (r, g, b, 0)

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0 or a >= 252:
                continue
            af = a / 255.0
            if af < 0.05:
                px[x, y] = (0, 0, 0, 0)
                continue
            nr = min(255, int(round(r / af)))
            ng = min(255, int(round(g / af)))
            nb = min(255, int(round(b / af)))
            if is_studio(nr, ng, nb, hard):
                px[x, y] = (0, 0, 0, 0)
            else:
                px[x, y] = (nr, ng, nb, a)

    halo_cleanup(px, w, h)

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0 and (r or g or b):
                px[x, y] = (0, 0, 0, 0)

    img = trim_pad(img)
    if max(img.size) > 800:
        img = img.resize((800, 800), Image.Resampling.LANCZOS)

    OUT.mkdir(parents=True, exist_ok=True)
    img.save(dst, format="PNG", optimize=True)
    print(f"✓ {dst.name} (transparent RGBA) → {dst}")


def main() -> None:
    if not ASSETS.is_dir():
        print(f"Assets folder not found: {ASSETS}", file=sys.stderr)
        sys.exit(1)
    for src_name, dst_name in JOBS:
        src = ASSETS / src_name
        if not src.exists():
            print(f"Missing source: {src}", file=sys.stderr)
            sys.exit(1)
        knock_black_bg(src, OUT / dst_name)


if __name__ == "__main__":
    main()
