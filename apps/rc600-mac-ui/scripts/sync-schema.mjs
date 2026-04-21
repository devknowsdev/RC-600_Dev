#!/usr/bin/env node
// sync-schema.mjs
// Strips YAML frontmatter from docs/reference/v1-memory-model.yaml
// and writes the clean runtime copy to public/v1-memory-model.yaml.
//
// Run: node scripts/sync-schema.mjs
// Runs automatically via predev and prebuild hooks.

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC  = resolve(__dirname, '../../../docs/reference/v1-memory-model.yaml')
const DEST = resolve(__dirname, '../public/v1-memory-model.yaml')

function stripFrontmatter(text) {
  const match = text.match(/^---\s*\n[\s\S]*?\n---\s*\n([\s\S]*)$/)
  return match ? match[1] : text
}

try {
  const raw   = readFileSync(SRC, 'utf8')
  const clean = stripFrontmatter(raw)
  writeFileSync(DEST,
    `# Auto-generated from docs/reference/v1-memory-model.yaml\n` +
    `# Do not edit directly. Run: node scripts/sync-schema.mjs\n\n` +
    clean
  )
  console.log(`sync-schema: wrote ${DEST}`)
} catch (err) {
  if (err.code === 'ENOENT') {
    console.warn(`sync-schema: source not found at ${SRC}, skipping.`)
    process.exit(0)
  }
  console.error('sync-schema: failed:', err.message)
  process.exit(1)
}
