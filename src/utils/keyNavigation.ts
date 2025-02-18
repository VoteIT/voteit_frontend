const DISALLOW_KEYNAV_SELECTORS = [
  'input',
  'textarea',
  '.no-keynav',
  '.v-overlay'
] as const
const DISALLOW_KEY_MODIFIERS = ['altKey', 'shiftKey', 'ctrlKey'] as const

function isElement(target: EventTarget | null): target is Element {
  return !!target && 'closest' in target
}

/**
 * Check if navigation event is allowed (no mods or on targets that are in .no-keynav or in .v-overlay elements)
 */
export function navigationEventAllowed(
  event: KeyboardEvent,
  allowMod?: (typeof DISALLOW_KEY_MODIFIERS)[number][]
) {
  for (const mod of DISALLOW_KEY_MODIFIERS)
    if (!allowMod?.includes(mod) && event[mod]) return false
  if (isElement(event.target))
    for (const selector of DISALLOW_KEYNAV_SELECTORS)
      if (event.target.closest(selector)) return false
  return true
}
