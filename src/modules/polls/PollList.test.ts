import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, expect, test, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'

import vuetify from '@/plugins/vuetify'
import { i18n } from '@/utils/locales'
import PollCard from './Poll.vue'
import PollList from './PollList.vue'
import { PollState } from './types'

vi.mock('../meetings/useMeetingId', () => ({
  default: () => ({ value: 1 })
}))

// Reactive, so a poll changing state moves it between groups like the store does
const polls = reactive([
  { pk: 1, state: PollState.Ongoing },
  { pk: 2, state: PollState.Finished }
])
vi.mock('./usePollStore', () => ({
  default: () => ({
    getMeetingPolls: (_meeting: number, state: PollState) =>
      polls.filter((p) => p.state === state),
    getAiPolls: () => []
  })
}))

vi.mock('./contentTypes', () => ({
  pollType: {
    sm: {
      getPriorityStates: () =>
        [PollState.Ongoing, PollState.Finished].map((state) => ({
          state,
          translate: () => state
        }))
    }
  }
}))

// Stands in for the poll card, which emits when its WorkflowState menu
// sends an event.
vi.mock('./Poll.vue', () => ({
  default: defineComponent({
    props: ['poll'],
    emits: ['transition'],
    setup: (props) => () => h('div', { class: 'poll-card' }, props.poll.pk)
  })
}))

beforeEach(() => {
  polls[0].state = PollState.Ongoing
  polls[1].state = PollState.Finished
})

function mountList(modelValue: PollState[]) {
  return mount(PollList, {
    props: { modelValue },
    global: { plugins: [vuetify, i18n] }
  })
}

function findCard(wrapper: ReturnType<typeof mountList>, pk: number) {
  return wrapper
    .findAllComponents(PollCard)
    .find((c) => c.props('poll').pk === pk)
}

/**
 * Like the real thing: the card emits when the event is sent, the socket moves
 * the poll (unmounting the card) and only then does the request resolve.
 */
async function transition(
  wrapper: ReturnType<typeof mountList>,
  pk: number,
  state: PollState | undefined
) {
  let resolve!: (s: PollState | undefined) => void
  const card = findCard(wrapper, pk)!
  card.vm.$emit(
    'transition',
    new Promise<PollState | undefined>((r) => (resolve = r))
  )
  if (state) polls.find((p) => p.pk === pk)!.state = state
  await nextTick()
  // The card that emitted is gone before the request resolves
  if (state) expect(card.exists()).toBe(false)
  resolve(state)
  await flushPromises()
}

test('Opens the group a poll was moved to', async () => {
  const wrapper = mountList([PollState.Ongoing])
  await transition(wrapper, 1, PollState.Finished)
  expect(wrapper.emitted('update:modelValue')).toEqual([
    [[PollState.Ongoing, PollState.Finished]]
  ])
})

test('Leaves the groups alone when the target is already open', async () => {
  const wrapper = mountList([PollState.Ongoing, PollState.Finished])
  await transition(wrapper, 1, PollState.Finished)
  expect(wrapper.emitted('update:modelValue')).toBeUndefined()
})

test('Opens nothing when the transition was cancelled or failed', async () => {
  const wrapper = mountList([PollState.Ongoing])
  await transition(wrapper, 1, undefined)
  expect(wrapper.emitted('update:modelValue')).toBeUndefined()
})
