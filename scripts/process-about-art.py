#!/usr/bin/env python3
"""Process about-page illustrations: remove matte backgrounds, export transparent PNGs."""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path('/Users/schei/.cursor/projects/Users-schei-puddles-v2/assets')
OUT = ROOT / 'public' / 'about'

MAPPING = {
    'about_puddles-e5e67d6b-225a-40c3-bd5f-5916a5396288.png': 'hero',
    'about_feet-5a7e28b1-6c3e-4fa5-b35d-e00f4e2ce263.png': 'feet',
    'about_book-7c30c84b-d47c-4fde-8078-5dd3d90b4d46.png': 'book',
    'about_trees-eb8b1bd8-8ea1-4ddc-a3b7-d1a41ce11222.png': 'tree',
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


def resize_to_width(image: Image.Image, width: int) -> Image.Image:
    w, h = image.size
    if w == width:
        return image
    height = max(1, round(h * (width / w)))
    return image.resize((width, height), Image.Resampling.LANCZOS)


def resize_to_height(image: Image.Image, height: int) -> Image.Image:
    w, h = image.size
    if h == height:
        return image
    width = max(1, round(w * (height / h)))
    return image.resize((width, height), Image.Resampling.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    meta: dict[str, tuple[int, int]] = {}

    for asset_name, stem in MAPPING.items():
        source = ASSETS / asset_name
        processed = trim_transparent(flood_remove_background(Image.open(source)))

        if stem == 'hero':
            hero_1x = resize_to_width(processed, 448)
            hero_2x = resize_to_width(processed, 896)
            hero_1x.save(OUT / 'hero.png', optimize=True)
            hero_2x.save(OUT / 'hero@2x.png', optimize=True)
            meta[stem] = hero_1x.size
            continue

        feature_1x = resize_to_height(processed, 56)
        feature_2x = resize_to_height(processed, 112)
        feature_1x.save(OUT / f'{stem}.png', optimize=True)
        feature_2x.save(OUT / f'{stem}@2x.png', optimize=True)
        meta[stem] = feature_1x.size

    print('Exported transparent about art:')
    for stem, size in meta.items():
        print(f'  {stem}: {size[0]}x{size[1]}')


if __name__ == '__main__':
    main()
