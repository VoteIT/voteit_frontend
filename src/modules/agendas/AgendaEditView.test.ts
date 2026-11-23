import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { beforeEach, expect, test, vi } from 'vitest'
import { computed, Ref, ref } from 'vue'

import vuetify from '@/plugins/vuetify'

import { AgendaItem, AgendaState } from './types'
import AgendaEditView from './AgendaEditView.vue'

const { mockListAction, mockHasOngoingPolls } = vi.hoisted(() => ({
  mockListAction: vi.fn(),
  mockHasOngoingPolls: vi.fn()
}))

// The agenda items the store would hold. Tests mutate this to stand in for the
// socket updates that follow a delete.
const items = ref<AgendaItem[]>([])

vi.mock('./useAgenda', () => ({
  default: (_meeting: unknown, tag: Ref<string | undefined>) => ({
    agenda: computed(() => items.value),
    filteredAgenda: computed(() =>
      items.value.filter((ai) => !tag.value || ai.tags.includes(tag.value))
    )
  })
}))
vi.mock('./useAgendaStore', () => ({
  default: () => ({ createAgendaItem: vi.fn() })
}))
vi.mock('./contentTypes', () => ({
  agendaItemType: {
    api: { listAction: mockListAction, patch: vi.fn(), delete: vi.fn() },
    sm: {
      getState: () => undefined,
      getStateList: () =>
        ['upcoming', 'closed'].map((state) => ({
          state,
          translate: () => state
        }))
    }
  }
}))
vi.mock('./rules', () => ({
  canDeleteAgendaItem: () => false,
  hasOngoingPolls: mockHasOngoingPolls
}))
vi.mock('./AgendaOrdering.vue', () => ({ default: { template: '<div />' } }))

vi.mock('../meetings/useMeeting', () => ({
  default: () => ({ isModerator: ref(true), meeting: ref(), meetingId: ref(1) })
}))
vi.mock('../meetings/useMeetingTitle', () => ({ default: vi.fn() }))
vi.mock('../meetings/MeetingToolbar.vue', () => ({
  default: { template: '<div><slot /></div>' }
}))
vi.mock('@/composables/usePermission', () => ({ default: vi.fn() }))

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return { ...actual, useI18n: () => ({ t: (key: string) => key }) }
})

vi.mock('@/components/Headline.vue', () => ({
  default: { props: ['modelValue'], template: '<h4>{{ modelValue }}</h4>' }
}))
vi.mock('@/components/DefaultDialog.vue', () => ({
  default: { template: '<div><slot name="activator" :props="{}" /></div>' }
}))
// Stands in for the confirmation dialog, so a test can confirm without opening it
vi.mock('@/components/QueryDialog.vue', () => ({
  default: {
    name: 'QueryDialog',
    props: ['text', 'color', 'confirm'],
    template: '<div><slot name="activator" :props="{}" /></div>'
  }
}))

function agendaItem(
  pk: number,
  state: AgendaState = AgendaState.Upcoming
): AgendaItem {
  return {
    pk,
    meeting: 1,
    title: `Item ${pk}`,
    tags: [],
    state,
    order: pk,
    block_proposals: false,
    block_discussion: false
  } as unknown as AgendaItem
}

async function mountView() {
  // @ts-ignore — vue-tsc cannot resolve mount overloads for script setup components
  const wrapper = mount(AgendaEditView, {
    global: { plugins: [vuetify], mocks: { $t: (key: string) => key } }
  })
  await flushPromises()
  return wrapper
}

function table(wrapper: VueWrapper) {
  return wrapper.findComponent({ name: 'VDataTable' })
}

/** What the table's v-model holds, visible rows or not */
function selected(wrapper: VueWrapper) {
  return [...(table(wrapper).props('modelValue') as number[])].sort(
    (a, b) => a - b
  )
}

async function setItemsPerPage(wrapper: VueWrapper, value: number) {
  table(wrapper).vm.$emit('update:itemsPerPage', value)
  await flushPromises()
}

function selectAllCheckbox(wrapper: VueWrapper) {
  return wrapper.find('thead input[type="checkbox"]')
    .element as HTMLInputElement
}

/**
 * The header checkbox reacts to its input event, which a click in happy-dom
 * doesn't fire, so toggle it the way the browser would.
 */
async function clickSelectAll(wrapper: VueWrapper) {
  const checkbox = selectAllCheckbox(wrapper)
  checkbox.checked = !checkbox.checked
  checkbox.dispatchEvent(new Event('input'))
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  mockHasOngoingPolls.mockReturnValue(false)
  items.value = Array.from({ length: 30 }, (_, i) => agendaItem(i + 1))
  // Deleting drops the items from the store, as the socket update would
  mockListAction.mockImplementation(
    async (action: string, { agenda_items }: { agenda_items: number[] }) => {
      if (action === 'bulk-delete')
        items.value = items.value.filter(({ pk }) => !agenda_items.includes(pk))
    }
  )
})

test('Select all only selects the rows on the current page', async () => {
  const wrapper = await mountView()
  await setItemsPerPage(wrapper, 10)
  await clickSelectAll(wrapper)
  expect(selected(wrapper)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
})

test('Deselect all also clears rows on other pages', async () => {
  const wrapper = await mountView()
  await setItemsPerPage(wrapper, -1)
  await clickSelectAll(wrapper)
  expect(selected(wrapper)).toHaveLength(30)

  await setItemsPerPage(wrapper, 10)
  await clickSelectAll(wrapper)
  expect(selected(wrapper)).toEqual([])
})

test('Select all with rows selected elsewhere adds the current page', async () => {
  const wrapper = await mountView()
  await setItemsPerPage(wrapper, 10)
  await clickSelectAll(wrapper)
  table(wrapper).vm.$emit('update:page', 2)
  await flushPromises()

  expect(selectAllCheckbox(wrapper).getAttribute('aria-checked')).toBe('mixed')
  await clickSelectAll(wrapper)
  expect(selected(wrapper)).toHaveLength(20)
})

test('Deleted items leave the selection', async () => {
  const wrapper = await mountView()
  await setItemsPerPage(wrapper, 10)
  await clickSelectAll(wrapper)

  const dialog = wrapper
    .findAllComponents({ name: 'QueryDialog' })
    .find((d) => d.props('text') === 'agenda.deleteSelectedConfirm')!
  await dialog.props('confirm')()
  await flushPromises()

  expect(mockListAction).toHaveBeenCalledWith('bulk-delete', {
    meeting: 1,
    agenda_items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  })
  expect(selected(wrapper)).toEqual([])
  expect(selectAllCheckbox(wrapper).checked).toBe(false)
})

test('Items deleted elsewhere leave the selection', async () => {
  const wrapper = await mountView()
  await clickSelectAll(wrapper)
  items.value = items.value.filter(({ pk }) => pk !== 3)
  await flushPromises()
  expect(selected(wrapper)).not.toContain(3)
  expect(selected(wrapper)).toHaveLength(24)
})

function stateButton(wrapper: VueWrapper, state: string) {
  return wrapper
    .findAllComponents({ name: 'VBtn' })
    .find((b) => b.text() === `agenda.setTo ${state}`)!
}

async function selectItems(wrapper: VueWrapper, pks: number[]) {
  table(wrapper).vm.$emit('update:modelValue', pks)
  await flushPromises()
}

test('Warns about selected ongoing items with ongoing polls', async () => {
  items.value = [agendaItem(1, AgendaState.Ongoing), agendaItem(2)]
  mockHasOngoingPolls.mockImplementation(({ pk }: AgendaItem) => pk === 1)
  const wrapper = await mountView()

  await selectItems(wrapper, [2])
  expect(wrapper.text()).not.toContain('agenda.cantLeaveOngoing')

  await selectItems(wrapper, [1, 2])
  expect(wrapper.text()).toContain('agenda.cantLeaveOngoing')
})

test('No warning for ongoing items without ongoing polls', async () => {
  items.value = [agendaItem(1, AgendaState.Ongoing)]
  const wrapper = await mountView()
  await selectItems(wrapper, [1])
  expect(wrapper.text()).not.toContain('agenda.cantLeaveOngoing')
  expect(stateButton(wrapper, 'closed').props('disabled')).toBe(false)
})

test('State change is disabled when only locked items would change', async () => {
  items.value = [agendaItem(1, AgendaState.Ongoing), agendaItem(2)]
  mockHasOngoingPolls.mockImplementation(({ pk }: AgendaItem) => pk === 1)
  const wrapper = await mountView()

  await selectItems(wrapper, [1])
  expect(stateButton(wrapper, 'closed').props('disabled')).toBe(true)
  expect(stateButton(wrapper, 'upcoming').props('disabled')).toBe(true)

  // An item that can change enables it again
  await selectItems(wrapper, [1, 2])
  expect(stateButton(wrapper, 'closed').props('disabled')).toBe(false)
})
