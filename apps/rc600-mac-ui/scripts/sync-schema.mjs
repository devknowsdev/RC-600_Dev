#!/usr/bin/env node
// sync-schema.mjs
// Strips YAML frontmatter from docs/reference/v1-memory-model.yaml
// and writes the clean runtime copy to public/v1-memory-model.yaml.
//
// Run automatically via prebuild and predev hooks.
// Also runnable directly: node scripts/sync-schema.mjs
//
// Why this exists:
// The docs version carries repo frontmatter (evidence, confidence, etc.)
// that the app doesn't need but js-yaml can't parse as a YAML document.
// The public version must be plain YAML with no frontmatter.
// A single automated sync step prevents the two copies from drifting.

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SRC = resolve(__dirname, '../../../docs/reference/v1-memory-model.yaml')
const DEST = resolve(__dirname, '../public/v1-memory-model.yaml')

function stripFrontmatter(text) {
  // Frontmatter is delimited by --- on its own line at the start of the file.
  // Match: optional leading whitespace, ---, content, --- on its own line.
  const match = text.match(/^---\s*\n[\s\S]*?\n---\s*\n([\s\S]*)$/)
  if (match) {
    return match[1]
  }
  // No frontmatter found — return as-is.
  return text
}

try {
  const raw = readFileSync(SRC, 'utf8')
  const clean = stripFrontmatter(raw)
  writeFileSync(DEST, `# Auto-generated from docs/reference/v1-memory-model.yaml\n# Do not edit directly. Run: node scripts/sync-schema.mjs\n\n${clean}`)
  console.log(`sync-schema: wrote ${DEST}`)
} catch (err) {
  // Non-fatal: if the docs version doesn't exist yet (e.g. fresh clone
  // before docs are populated), skip silently and let the existing
  // public version be used.
  if (err.code === 'ENOENT') {
    console.warn(`sync-schema: source not found at ${SRC}, skipping.`)
    process.exit(0)
  }
  console.error('sync-schema: failed:', err.message)
  process.exit(1)
}
