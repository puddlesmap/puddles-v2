import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const SHARED = {
  'halloween-part-1-carousel': { dir: 'halloween-1010-17', text: 'caption.txt' },
  'xhs-halloween-part-1': { dir: 'halloween-1010-17', text: 'xiaohongshu.txt' },
  'halloween-part-2-carousel': { dir: 'halloween-1024-31', text: 'caption.txt' },
  'xhs-halloween-part-2': { dir: 'halloween-1024-31', text: 'xiaohongshu.txt' },
  'halloween-part-1-story': { dir: 'halloween-1010-17/stories/oct-13', text: 'caption.txt' },
  'halloween-part-2-share-story': { dir: 'halloween-1024-31/stories/oct-20', text: 'caption.txt' },
  'halloween-today-story': { dir: 'halloween-1024-31/stories/oct-24', text: 'caption.txt' },
  'halloween-midweek-story': { dir: 'halloween-1024-31/stories/oct-28', text: 'caption.txt' },
  'halloween-day-story': { dir: 'halloween-1024-31/stories/oct-31', text: 'caption.txt' },
}

export function exportRoot() {
  return process.env.SOCIAL_STUDIO_EXPORT_DIR
    || path.join(os.homedir(), 'Documents/Projects/Puddles WIP/_Instagram/2_weekly highllight')
}

/** Netlify’s Next server does not set NETLIFY=true. /var/task is that host. */
export function onNetlifyRuntime() {
  const cwd = process.cwd()
  if (cwd === '/var/task' || cwd.startsWith('/var/task/')) return true
  const env = process.env
  return env.NETLIFY === 'true' || Boolean(env.AWS_LAMBDA_FUNCTION_NAME) || Boolean(env.LAMBDA_TASK_ROOT)
}

/** The weekly folder lives on this Mac. Netlify has no such path, so live approve skips it. */
export function folderExportEnabled() {
  if (process.env.SOCIAL_STUDIO_FOLDER === 'off') return false
  if (process.env.SOCIAL_STUDIO_FOLDER === 'on') return true
  if (process.env.SOCIAL_STUDIO_EXPORT_DIR?.trim()) return true
  if (onNetlifyRuntime()) return false
  return true
}

export function exportTarget(item) {
  const shared = SHARED[item.id]
  if (shared) return shared
  const text = item.format === 'xiaohongshu' ? 'xiaohongshu.txt' : 'caption.txt'
  return { dir: item.id, text }
}

export async function writeApprovedItem(item, { root = exportRoot(), readAsset }) {
  const target = exportTarget(item)
  const folder = path.join(root, target.dir)
  fs.mkdirSync(folder, { recursive: true })
  const slides = item.approved?.slides || []
  for (let index = 0; index < slides.length; index += 1) {
    const asset = await readAsset(slides[index].token)
    if (!asset?.bytes) throw new Error(`Missing slide for ${item.id}.`)
    const name = `${String(index + 1).padStart(2, '0')}.png`
    fs.writeFileSync(path.join(folder, name), asset.bytes)
  }
  const caption = item.approved?.caption || ''
  fs.writeFileSync(path.join(folder, target.text), caption)
  return folder
}
