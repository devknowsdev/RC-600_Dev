import yaml from 'js-yaml'
import type { MemoryModel } from './memoryModelTypes'

export async function loadMemoryModel(): Promise<MemoryModel> {
  const res = await fetch('/v1-memory-model.yaml')
  if (!res.ok) {
    throw new Error(`Failed to load memory model: ${res.status} ${res.statusText}`)
  }
  const text = await res.text()
  const parsed = yaml.load(text)

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Memory model YAML did not parse to an object')
  }

  const model = parsed as MemoryModel

  if (!Array.isArray(model.memory_sections)) {
    throw new Error('Memory model missing memory_sections array')
  }

  return model
}
