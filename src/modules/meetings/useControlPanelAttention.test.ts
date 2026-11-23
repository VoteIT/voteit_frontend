import { computed, ref } from 'vue'
import { expect, test, vi } from 'vitest'

const canChange = ref(true)
vi.mock('./useMeeting', () => ({
  default: () => ({
    canChange,
    meeting: computed(() => ({ pk: 1 }))
  })
}))
const componentOff = ref(false)
vi.mock('./useRequiredComponent', () => ({
  default: (name: string) => ({
    warnRequired: name === 'some_component' ? componentOff : ref(false)
  })
}))
// Keep the real panels out, so only the ones registered here are counted
vi.mock('./controlPanels', () => ({}))

import { meetingSettingsPlugins } from './registry'
import useControlPanelAttention from './useControlPanelAttention'

const needsCheck = ref(false)
const inactiveAttention = ref(true)

meetingSettingsPlugins.register({
  id: 'b',
  icon: 'mdi-b',
  getTitle: () => 'B panel',
  useRequiresAttention: () => needsCheck
})
meetingSettingsPlugins.register({
  id: 'a',
  icon: 'mdi-a',
  getTitle: () => 'A panel'
})
meetingSettingsPlugins.register({
  id: 'some_component',
  icon: 'mdi-d',
  getTitle: () => 'D panel'
})
meetingSettingsPlugins.register({
  id: 'inactive',
  checkActive: () => false,
  icon: 'mdi-c',
  getTitle: () => 'C panel',
  useRequiresAttention: () => inactiveAttention
})

test('follows active panels requiring attention', () => {
  const { hasAttention, requiresAttention } = useControlPanelAttention()
  expect(hasAttention.value).toBe(false)
  expect(requiresAttention('inactive')).toBe(false)

  needsCheck.value = true
  expect(hasAttention.value).toBe(true)
  expect(requiresAttention('b')).toBe(true)
  expect(requiresAttention('a')).toBe(false)

  needsCheck.value = false
  expect(hasAttention.value).toBe(false)
})

test('requires attention when a required component is off', () => {
  const { hasAttention, requiresAttention } = useControlPanelAttention()
  componentOff.value = true
  expect(requiresAttention('some_component')).toBe(true)
  expect(hasAttention.value).toBe(true)
  componentOff.value = false
  expect(hasAttention.value).toBe(false)
})

test('shows no attention to those who cannot change the meeting', () => {
  const { hasAttention } = useControlPanelAttention()
  needsCheck.value = true
  canChange.value = false
  expect(hasAttention.value).toBe(false)
  canChange.value = true
  expect(hasAttention.value).toBe(true)
  needsCheck.value = false
})
