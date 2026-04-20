import yaml from 'js-yaml'

export async function loadMemoryModel() {
  const res = await fetch('/v1-memory-model.yaml')
  const text = await res.text()
  return yaml.load(text) as any
}
