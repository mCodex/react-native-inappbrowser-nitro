#!/usr/bin/env node

const path = require('path')
const { promises: fs } = require('fs')

async function removeMaps(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })

  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        await removeMaps(entryPath)
        return
      }

      if (entry.isFile() && entry.name.endsWith('.map')) {
        await fs.unlink(entryPath)
      }
    })
  )
}

async function main() {
  const libPath = path.join(__dirname, '..', 'lib')

  try {
    await fs.access(libPath)
  } catch {
    return
  }

  await removeMaps(libPath)
}

main().catch((error) => {
  console.error('Failed to remove source maps from lib directory:', error)
  process.exitCode = 1
})
