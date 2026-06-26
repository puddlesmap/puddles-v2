#!/usr/bin/env python3
"""Process home-experiment accent illustrations with transparent backgrounds."""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path('/Users/schei/.cursor/projects/Users-schei-puddles-v2/assets')
OUT = ROOT / 'public' / 'home-experiment'

MAPPING = {
    'home_rain-77f3cff8-d40c-474b-aaff-870c9bc8c725.png': 'rain',
    'home_boots-e8ed163c-d5c4-4ada-a2f6-2e8a7cd2f9af.png': 'boots',
    'home_flower-6e2ff194-9a9f-4b3d-bac7-8381c1ddfb43.png': 'flower',
    'home_heart-535a7946-a897-496b-8835-2965dc5f6d6d.png': 'heart',
}


def is_neutral_background(r: int, g: int, b: int) -> bool:
    spread = max(r, g, b) - min(r, g, b)
    if spread > 14:
        return False
    if min(r, g, b) >= 235:
        return True
    if r >= 246 and g >= 243 and b >= 238:
        return True
    return False


def flood_remove_background(image: Image.Image, tolerance: int = 20) -> Image.Image:
    rgba = image.convert('RGBA')
    width, height = rgba.size
    pixels = rgba.load()
    visited: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque()

    seeds: list[tuple[int, int]] = [
        (0, 0),
        (width - 1, 0),
        (0, height - 1),
        (width - 1, height - 1),
    ]
    for x in (width // 4, width // 2, (3 * width) // 4):
        seeds.extend([(x, 0), (x, height - 1)])
    for y in (height // 4, height // 2, (3 * height) // 4):
        seeds.extend([(0, y), (width - 1, y)])

    for seed in seeds:
        queue.append(seed)

    br, bg, bb, _ = pixels[0, 0]

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited:
            continue
        if x < 0 or y < 0 or x >= width or y >= height:
            continue
        visited.add((x, y))

        r, g, b, a = pixels[x, y]
        if a == 0:
            continue

        if not is_neutral_background(r, g, b):
            continue

        if not (
            abs(r - br) <= tolerance
            and abs(g - bg) <= tolerance
            and abs(b - bb) <= tolerance
        ) and not (r >= 246 and g >= 243 and b >= 238):
            continue

        pixels[x, y] = (r, g, b, 0)
        queue.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    return rgba


def trim_transparent(image: Image.Image) -> Image.Image:
    bbox = image.getbbox()
    if not bbox:
        return image
    return image.crop(bbox)


def resize_to_height(image: Image.Image, height: int) -> Image.Image:
    w, h = image.size
    if h == height:
        return image
    width = max(1, round(w * (height / h)))
    return image.resize((width, height), Image.Resampling.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    for asset_name, stem in MAPPING.items():
        source = ASSETS / asset_name
        processed = trim_transparent(flood_remove_background(Image.open(source)))
        accent_1x = resize_to_height(processed, 112)
        accent_2x = resize_to_height(processed, 224)
        accent_1x.save(OUT / f'{stem}.png', optimize=True)
        accent_2x.save(OUT / f'{stem}@2x.png', optimize=True)
        print(f'{stem}: {accent_1x.size[0]}x{accent_1x.size[1]}')


if __name__ == '__main__':
    main()
