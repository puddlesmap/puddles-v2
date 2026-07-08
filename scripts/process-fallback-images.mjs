#!/usr/bin/env node
/**
 * Strip watermark badges from category fallback images and copy to public/.
 * Run: node scripts/process-fallback-images.mjs
 */
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const ASSETS = join(ROOT, '..', '.cursor', 'projects', 'Users-schei-puddles-v2', 'assets')
const OUT = join(ROOT, 'public', 'event-fallbacks')

const MAPPINGS = [
  ['Build___Explore-9ff4fce1-512a-4ff7-b4c2-8e95ca23a524.png', 'build.png', 'square-badge'],
  ['Classes_2-ba6d3167-7e36-454a-833b-6d78b9e23836.png', 'classes.png', 'bottom-label'],
  ['Other-fc130138-8100-454d-b194-e4b2f87d4561.png', 'other.png', 'square-badge'],
  ['Music___movement-8cf9dc65-3845-4175-8ec3-e2172b2f2798.png', 'music.png', 'square-badge'],
  ['Art___Crafts-42007422-2c79-4812-a3a9-b4bf95c04083.png', 'arts.png', 'square-badge'],
  ['Social___Play-53c07eb4-7428-44ba-94dc-edbcb17bb142.png', 'play.png', 'square-badge'],
  ['Outdoor-a3248d95-68da-4dd8-a0cd-06a08b754a53.png', 'outdoor.png', 'square-badge'],
  ['Stories-7641664f-9fea-4691-96df-c0d5e0c8dc5a.png', 'stories.png', 'square-badge'],
]

const PY = `
from PIL import Image, ImageDraw
import json, sys

src, dst, mode = sys.argv[1], sys.argv[2], sys.argv[3]
img = Image.open(src).convert('RGB')
w, h = img.size
draw = ImageDraw.Draw(img)
white = (255, 255, 255)

if mode == 'square-badge':
    # "puddles" pill badge — top-left on 1024 square assets
    draw.rounded_rectangle([0, 0, int(w * 0.26), int(h * 0.11)], radius=28, fill=white)
elif mode == 'bottom-label':
    # "classes" label — bottom center on landscape asset
    strip_h = int(h * 0.14)
    draw.rectangle([0, h - strip_h, w, h], fill=white)

img.save(dst, format='PNG', optimize=True)

# Resize for web — keep detail but avoid multi-MB assets
max_dim = 800
w, h = img.size
if max(w, h) > max_dim:
    ratio = max_dim / max(w, h)
    img = img.resize((int(w * ratio), int(h * ratio)), Image.Resampling.LANCZOS)

# Knock out connected near-white outer background (preserve interior whites like book pages)
img = img.convert('RGBA')
px = img.load()
w, h = img.size

from collections import deque

def flood_transparent(predicate):
    visited = set()
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if predicate(*px[x, y]):
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if predicate(*px[x, y]):
                q.append((x, y))

    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or (x, y) in visited:
            continue
        if not predicate(*px[x, y]):
            continue
        visited.add((x, y))
        px[x, y] = (px[x, y][0], px[x, y][1], px[x, y][2], 0)
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

if dst.endswith('music.png'):
    def is_music_studio(r, g, b, a):
        if a == 0:
            return True
        mx = max(r, g, b)
        mn = min(r, g, b)
        if mx - mn > 14:
            return False
        return mx >= 247

    flood_transparent(is_music_studio)
else:
    def is_warm_bg(r, g, b, a):
        if a == 0:
            return True
        mx = max(r, g, b)
        mn = min(r, g, b)
        if mx < 228 or (mx - mn) > 22:
            return False
        avg = (r + g + b) / 3
        if avg >= 252:
            return False
        return r >= g and g >= b - 3

    def blocks_flood(r, g, b, a):
        if a == 0:
            return True
        mx = max(r, g, b)
        mn = min(r, g, b)
        return (mx - mn) > 24

    visited = set()
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_warm_bg(*px[x, y]):
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_warm_bg(*px[x, y]):
                q.append((x, y))

    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or (x, y) in visited:
            continue
        r, g, b, a = px[x, y]
        if blocks_flood(r, g, b, a):
            continue
        if not is_warm_bg(r, g, b, a):
            continue
        visited.add((x, y))
        px[x, y] = (r, g, b, 0)
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

# Erase watermark cover patches (painted pure white, not caught by warm-bg flood fill)
def erase_near_white(x0, y0, x1, y1):
    for y in range(max(0, y0), min(h, y1)):
        for x in range(max(0, x0), min(w, x1)):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if r >= 248 and g >= 248 and b >= 248:
                px[x, y] = (r, g, b, 0)

if mode == 'square-badge':
    erase_near_white(0, 0, int(w * 0.28), int(h * 0.12))
elif mode == 'bottom-label':
    erase_near_white(0, int(h * 0.86), w, h)

img.save(dst, format='PNG', optimize=True)

print(json.dumps({'w': img.size[0], 'h': img.size[1], 'dst': dst}))
`

mkdirSync(OUT, { recursive: true })

for (const [srcName, outName, mode] of MAPPINGS) {
  const src = join(ASSETS, srcName)
  const dst = join(OUT, outName)
  const result = spawnSync('python3', ['-c', PY, src, dst, mode], {
    encoding: 'utf8',
    cwd: ROOT,
  })
  if (result.status !== 0) {
    console.error(`Failed ${outName}:`, result.stderr)
    process.exit(1)
  }
  console.log(`✓ ${outName} ← ${srcName}`, result.stdout.trim())
}

console.log('Done —', MAPPINGS.length, 'fallback images updated in public/event-fallbacks/')
