import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, expect, test, vi } from 'vitest'
import { shallowRef } from 'vue'

import vuetify from '@/plugins/vuetify'
import AddMeetingModal from './AddMeetingModal.vue'

const { mockPush, mockAdd, dialects, erMethods } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockAdd: vi.fn(),
  // Assigned real refs in beforeEach, once vue is importable
  dialects: { value: null as { value: unknown } | null },
  erMethods: { value: null as { value: unknown } | null }
}))

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return { ...actual, useRouter: vi.fn(() => ({ push: mockPush })) }
})

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return { ...actual, useI18n: () => ({ t: (key: string) => key }) }
})

vi.mock('./contentTypes', () => ({
  meetingType: { api: { add: mockAdd } }
}))

vi.mock('./dialects/useDialects', () => ({
  default: () => ({
    installableDialects: dialects.value,
    loadDialects: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('./electoralRegisters/useElectoralRegisters', () => ({
  default: () => ({ availableErMethods: erMethods.value })
}))

vi.mock('./electoralRegisters/utils', () => ({
  iterErAttributes: () => []
}))

const DIALECT = {
  name: 'sfs',
  title: 'SFS dialect',
  description: 'For SFS meetings'
}

const ER_METHODS = [
  { name: 'manual', title: 'Manual', description: 'Manual register' },
  {
    name: 'auto_before_poll',
    title: 'Auto',
    description: 'Automatic register'
  }
]

function mountModal() {
  // @ts-ignore — vue-tsc cannot resolve mount overloads for script setup components
  return mount(AddMeetingModal, {
    global: {
      plugins: [vuetify],
      stubs: { SpeakerSystemForm: true },
      mocks: { $t: (key: string) => key }
    }
  })
}

type Wrapper = ReturnType<typeof mountModal>

function stepTitle(wrapper: Wrapper) {
  return wrapper.find('.v-card-title').text()
}

function nextButton(wrapper: Wrapper) {
  return wrapper.find('button[type="submit"]')
}

async function next(wrapper: Wrapper) {
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

async function selectCard(wrapper: Wrapper, text: string) {
  const card = wrapper
    .findAll('.v-item-group .v-card')
    .find((c) => c.text().includes(text))
  if (!card) throw new Error(`No card with text "${text}"`)
  await card.trigger('click')
  await flushPromises()
}

async function fillTitle(wrapper: Wrapper) {
  await wrapper.find('input').setValue('My new meeting')
  await flushPromises()
}

beforeEach(() => {
  mockPush.mockReset()
  mockAdd.mockReset().mockResolvedValue({ pk: 7, title: 'My new meeting' })
  dialects.value = shallowRef([DIALECT])
  erMethods.value = shallowRef(ER_METHODS)
})

test('walks through all steps when dialects are available', async () => {
  const wrapper = mountModal()
  expect(stepTitle(wrapper)).toBe('meeting.createBaseTitle')

  await fillTitle(wrapper)
  await next(wrapper)
  expect(stepTitle(wrapper)).toBe('meeting.createDialectTitle')

  await selectCard(wrapper, 'meeting.createDialectNone')
  await next(wrapper)
  expect(stepTitle(wrapper)).toBe('meeting.createRoomTitle')

  await next(wrapper)
  expect(stepTitle(wrapper)).toBe('meeting.createErTitle')
})

test('keeps a dialect choice selected', async () => {
  const wrapper = mountModal()
  await fillTitle(wrapper)
  await next(wrapper)
  const noneCard = () =>
    wrapper
      .findAll('.v-item-group .v-card')
      .find((c) => c.text().includes('meeting.createDialectNone'))!

  expect(noneCard().classes()).toContain('bg-success')
  // Clicking the selected card must not deselect it
  await selectCard(wrapper, 'meeting.createDialectNone')
  expect(noneCard().classes()).toContain('bg-success')
  expect(nextButton(wrapper).attributes('disabled')).toBeUndefined()
})

test('skips the dialect step when no dialects are available', async () => {
  dialects.value = shallowRef([])
  const wrapper = mountModal()

  await fillTitle(wrapper)
  await next(wrapper)
  expect(stepTitle(wrapper)).toBe('meeting.createRoomTitle')
})

test('creates a meeting with the preselected electoral register', async () => {
  const wrapper = mountModal()
  await fillTitle(wrapper)
  await next(wrapper)
  await selectCard(wrapper, 'meeting.createDialectNone')
  await next(wrapper)
  await next(wrapper)
  await next(wrapper)

  expect(mockAdd).toHaveBeenCalledWith({
    title: 'My new meeting',
    er_policy_name: 'auto_before_poll',
    install_dialect: undefined
  })
  expect(mockPush).toHaveBeenCalledWith('/m/7/my-new-meeting')
})

test('choosing a dialect drops the electoral register step', async () => {
  const wrapper = mountModal()
  await fillTitle(wrapper)
  await next(wrapper)
  await selectCard(wrapper, DIALECT.title)
  await next(wrapper)
  expect(nextButton(wrapper).text()).toBe('meeting.create')

  await next(wrapper)
  expect(mockAdd).toHaveBeenCalledWith({
    title: 'My new meeting',
    er_policy_name: undefined,
    install_dialect: 'sfs'
  })
})
