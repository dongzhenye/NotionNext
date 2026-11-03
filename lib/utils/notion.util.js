/**
 * Normalize current and legacy Notion record wrappers to `{ value: record }`.
 *
 * Current responses wrap records as
 * `{ spaceId, value: { value: record, role } }`, while this branch's data
 * pipeline expects the legacy `{ value: record }` shape.
 */
export function adapterNotionBlockMap(blockMap) {
  if (!blockMap) return blockMap

  const block = {}
  const collection = {}

  for (const [id, entry] of Object.entries(blockMap.block || {})) {
    block[id] = { value: unwrapValue(entry) }
  }

  for (const [id, entry] of Object.entries(blockMap.collection || {})) {
    collection[id] = { value: unwrapValue(entry) }
  }

  return { ...blockMap, block, collection }
}

function unwrapValue(entry) {
  if (!entry) return entry
  if (entry?.value?.value?.id && entry?.value?.role) {
    return entry.value.value
  }
  if (entry?.value?.id && entry?.role !== undefined) {
    return entry.value
  }
  if (entry?.value?.id) {
    return entry.value
  }
  return entry?.value ?? entry
}
