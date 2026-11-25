import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, expect, test, vi } from 'vitest'

import vuetify from '@/plugins/vuetify'
import { i18n } from '@/utils/locales'
import WorkflowState from './WorkflowState.vue'

const { dialogAlert } = vi.hoisted(() => ({ dialogAlert: vi.fn() }))
vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  dialogAlert
}))

const sendEvent = vi.fn()
const contentType = {
  sm: {
    getAvailableEvents: () => [],
    getState: () => ({ final: false, translate: () => 'Ongoing' }),
    sendEvent
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

function mountState() {
  return mount(WorkflowState, {
    props: {
      admin: true,
      contentType: contentType as any,
      object: { pk: 1, state: 'ongoing', title: 'Poll' }
    },
    global: { plugins: [vuetify, i18n] }
  })
}

/** Sends an event, returning the new state promise it emitted */
async function send(wrapper: ReturnType<typeof mountState>, event: string) {
  await (
    wrapper.vm as unknown as { sendEvent: (e: string) => Promise<void> }
  ).sendEvent(event)
  const emitted = wrapper.emitted('transition')
  expect(emitted).toHaveLength(1)
  return emitted![0][0] as Promise<string | undefined>
}

test('Emits a promise of the new state after a transition', async () => {
  // The event endpoint responds with the object's new state
  sendEvent.mockResolvedValue({ state: 'finished', events: [] })
  const wrapper = mountState()
  expect(await send(wrapper, 'close')).toBe('finished')
})

test('Emits before the transition completes', async () => {
  // Callers can't rely on hearing from this component afterwards: the new
  // state usually arrives over the socket first and unmounts it.
  let resolve!: (r: unknown) => void
  sendEvent.mockReturnValue(new Promise((r) => (resolve = r)))
  const wrapper = mountState()
  const sent = (
    wrapper.vm as unknown as { sendEvent: (e: string) => Promise<void> }
  ).sendEvent('close')
  expect(wrapper.emitted('transition')).toHaveLength(1)
  resolve({ state: 'finished', events: [] })
  await sent
})

test('Resolves to undefined when the transition is cancelled', async () => {
  // A guard dialog answered "no" resolves without calling the API
  sendEvent.mockResolvedValue(undefined)
  const wrapper = mountState()
  expect(await send(wrapper, 'close')).toBeUndefined()
})

test('Resolves to undefined when the transition fails', async () => {
  sendEvent.mockRejectedValue(new Error('Nope'))
  const wrapper = mountState()
  expect(await send(wrapper, 'close')).toBeUndefined()
  await flushPromises()
  expect(dialogAlert).toHaveBeenCalled()
})
