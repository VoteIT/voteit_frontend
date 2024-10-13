const DISALLOW_KEYNAV_CLASSES = ['.no-keynav', '.v-overlay'] as const

function isElement(target: EventTarget | null): target is Element {
  return !!target && 'closest' in target
}

/**
 * Check if navigation event is allowed (no mods or on targets that are in .no-keynav or in .v-overlay elements)
 */
export function navigationEventAllowed(event: KeyboardEvent) {
  if (event.altKey || event.shiftKey || event.ctrlKey) return false
  if (!isElement(event.target)) return true
  for (const cls of DISALLOW_KEYNAV_CLASSES)
    if (event.target.closest(cls)) return false
  return true
}
