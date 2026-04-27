import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Resolve from the monorepo root (packages/core-platform/src → packages/core-platform → packages → root)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const VIDEO_TYPES_PATH = join(ROOT, 'config', 'video-types.json')

let _cache = null

export async function loadVideoTypes() {
  if (!_cache) {
    const raw = await readFile(VIDEO_TYPES_PATH, 'utf-8')
    _cache = JSON.parse(raw)
  }
  return _cache
}

export async function loadVideoType(type) {
  const types = await loadVideoTypes()
  if (!types[type]) {
    const available = Object.keys(types).join(', ')
    throw new Error(`Unknown video type "${type}". Available: ${available}`)
  }
  return { id: type, ...types[type] }
}
