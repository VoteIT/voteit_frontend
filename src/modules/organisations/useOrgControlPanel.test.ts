import { ref } from 'vue'
import { expect, test, vi } from 'vitest'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('./useOrgStore', () => ({
  default: () => ({ organisation: { pk: 1, title: 'Test org' } })
}))
// Keep the real panels out, so only the ones registered here are counted
vi.mock('./controlPanels', () => ({}))

import { orgControlPanelPlugins } from './registry'
import useOrgControlPanel from './useOrgControlPanel'

const needsCheck = ref(false)
const inactiveAttention = ref(true)

orgControlPanelPlugins.register({
  id: 'b',
  component: {},
  icon: 'mdi-b',
  getTitle: () => 'B panel',
  useRequiresAttention: () => needsCheck
})
orgControlPanelPlugins.register({
  id: 'a',
  component: {},
  icon: 'mdi-a',
  getTitle: () => 'A panel'
})
orgControlPanelPlugins.register({
  id: 'inactive',
  checkActive: () => false,
  component: {},
  icon: 'mdi-c',
  getTitle: () => 'C panel',
  useRequiresAttention: () => inactiveAttention
})

test('lists active panels sorted by title', () => {
  const { panels } = useOrgControlPanel()
  expect(panels.value.map((p) => p.id)).toEqual(['a', 'b'])
  expect(panels.value[0].to).toEqual({
    name: 'orgControlPanel',
    params: { panel: 'a' }
  })
})

test('counts active panels requiring attention, following their state', () => {
  const { attentionCount, panels } = useOrgControlPanel()
  expect(attentionCount.value).toBe(0)

  needsCheck.value = true
  expect(attentionCount.value).toBe(1)
  expect(panels.value.find((p) => p.id === 'b')?.requiresAttention).toBe(true)

  needsCheck.value = false
  expect(attentionCount.value).toBe(0)
})
