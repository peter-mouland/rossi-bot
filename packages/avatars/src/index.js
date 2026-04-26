import { readdir, readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const AVATARS_DIR = join(__dirname, '..')

export async function loadAvatars() {
  const entries = await readdir(AVATARS_DIR, { withFileTypes: true })
  const dirs = entries.filter(e => e.isDirectory() && e.name !== 'src' && e.name !== 'node_modules')
  return Promise.all(
    dirs.map(async dir => {
      const dirPath = join(AVATARS_DIR, dir.name)
      const raw = await readFile(join(dirPath, 'config.json'), 'utf-8')
      return { ...JSON.parse(raw), dir: dirPath }
    })
  )
}

export async function loadAvatar(id) {
  const avatars = await loadAvatars()
  return avatars.find(a => a.id === id) ?? null
}
