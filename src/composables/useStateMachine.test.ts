import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ThemeColor } from '@/utils/types'
import useStateMachine, {
  fetchStateMachines,
  noValidation,
  registerValidator,
  StateContent
} from './useStateMachine'

// ─── mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/utils/restApi', () => ({
  default: { get: vi.fn() }
}))

vi.mock('@/utils', () => ({
  dialogQuery: vi.fn()
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (s: string) => s })
}))

import restApi from '@/utils/restApi'
import { dialogQuery } from '@/utils'

// ─── fixtures ─────────────────────────────────────────────────────────────────

type State = 'draft' | 'ongoing' | 'closed'
type Event = 'start' | 'close'

type Obj = StateContent<State> & { pk: number }

const MACHINE_NAME = 'test_machine'

const MACHINE_DEF = {
  name: MACHINE_NAME,
  states: {
    draft: { name: 'Draft', initial: true },
    ongoing: { name: 'Ongoing', priority: 1 },
    closed: { name: 'Closed', final: true, priority: 2 }
  },
  events: {
    start: {
      name: 'Start',
      transitions: [{ cond: [], from: 'draft', to: 'ongoing', validators: [] }]
    },
    close: {
      name: 'Close',
      transitions: [{ cond: [], from: 'ongoing', to: 'closed', validators: [] }]
    }
  }
}

const translate = () => ''

const META = {
  draft: { icon: 'mdi-pencil', translate },
  ongoing: { icon: 'mdi-play', color: ThemeColor.Success, translate },
  closed: { icon: 'mdi-check', translate }
}

const mockApi = { action: vi.fn() }

function makeSM() {
  return useStateMachine<Obj, Event>(MACHINE_NAME, META, mockApi as any)
}

// Wrap in arrow so Vitest's TestContext arg doesn't override the default parameter
async function loadMachines() {
  vi.mocked(restApi.get).mockResolvedValueOnce({
    [MACHINE_NAME]: MACHINE_DEF
  })
  await fetchStateMachines()
}

const t = (s: string) => s

// ─── noValidation ─────────────────────────────────────────────────────────────

test('noValidation returns true', () => {
  expect(noValidation()).toBe(true)
})

// ─── fetchStateMachines ───────────────────────────────────────────────────────

describe('fetchStateMachines', () => {
  test('populates states and events', async () => {
    await loadMachines()
    const { states } = makeSM()
    expect(Object.keys(states.value)).toEqual(['draft', 'ongoing', 'closed'])
  })

  test('returns empty states when machine not loaded', () => {
    const sm = useStateMachine<Obj, Event>(
      'unknown_machine',
      META,
      mockApi as any
    )
    expect(sm.states.value).toEqual({})
  })
})

// ─── getState ─────────────────────────────────────────────────────────────────

describe('getState', () => {
  beforeEach(() => loadMachines())

  test('merges state definition with meta', () => {
    const { getState } = makeSM()
    const s = getState('ongoing')
    expect(s.state).toBe('ongoing')
    expect(s.name).toBe('Ongoing')
    expect(s.icon).toBe('mdi-play')
    expect(s.color).toBe(ThemeColor.Success)
  })
})

// ─── getStateList ─────────────────────────────────────────────────────────────

describe('getStateList', () => {
  beforeEach(() => loadMachines())

  test('returns all states when no predicate', () => {
    const { getStateList } = makeSM()
    expect([...getStateList()].map((s) => s.state)).toEqual([
      'draft',
      'ongoing',
      'closed'
    ])
  })

  test('filters by predicate', () => {
    const { getStateList } = makeSM()
    const result = [...getStateList((s) => !!s.final)]
    expect(result.map((s) => s.state)).toEqual(['closed'])
  })
})

// ─── getPriorityStates ────────────────────────────────────────────────────────

describe('getPriorityStates', () => {
  beforeEach(() => loadMachines())

  test('returns only states with priority, sorted ascending', () => {
    const { getPriorityStates } = makeSM()
    const result = [...getPriorityStates()]
    expect(result.map((s) => s.state)).toEqual(['ongoing', 'closed'])
  })

  test('further filters by predicate', () => {
    const { getPriorityStates } = makeSM()
    const result = [...getPriorityStates((s) => s.state === 'closed')]
    expect(result.map((s) => s.state)).toEqual(['closed'])
  })
})

// ─── getEventForTarget ────────────────────────────────────────────────────────

describe('getEventForTarget', () => {
  beforeEach(() => loadMachines())

  test('returns the event id for a valid transition', () => {
    const { getEventForTarget } = makeSM()
    expect(getEventForTarget('draft', 'ongoing')).toBe('start')
  })

  test('returns undefined when no transition exists', () => {
    const { getEventForTarget } = makeSM()
    expect(getEventForTarget('draft', 'closed')).toBeUndefined()
  })
})

// ─── getAvailableEvents ───────────────────────────────────────────────────────

describe('getAvailableEvents', () => {
  beforeEach(() => loadMachines())

  test('returns events matching current state', () => {
    const { getAvailableEvents } = makeSM()
    const events = getAvailableEvents({ pk: 1, state: 'draft' }, t)
    expect(events).toHaveLength(1)
    expect(events[0].id).toBe('start')
    expect(events[0].disabled).toBe(false)
  })

  test('excludes events not matching current state', () => {
    const { getAvailableEvents } = makeSM()
    expect(getAvailableEvents({ pk: 1, state: 'closed' }, t)).toHaveLength(0)
  })

  test('carries color and icon from target state meta', () => {
    const { getAvailableEvents } = makeSM()
    const [event] = getAvailableEvents({ pk: 1, state: 'draft' }, t)
    // target state is 'ongoing' which has color:success and icon:mdi-play
    expect(event.color).toBe(ThemeColor.Success)
    expect(event.icon).toBe('mdi-play')
  })

  test('sets disabled=true and reason when validator fails', async () => {
    const MACHINE = 'av_validator_machine'
    registerValidator(MACHINE, 'always_fail', () => 'Not allowed')
    vi.mocked(restApi.get).mockResolvedValueOnce({
      [MACHINE]: {
        name: MACHINE,
        states: { a: { name: 'A' }, b: { name: 'B' } },
        events: {
          go: {
            name: 'Go',
            transitions: [
              { cond: [], from: 'a', to: 'b', validators: ['always_fail'] }
            ]
          }
        }
      }
    })
    await fetchStateMachines()
    const sm = useStateMachine<StateContent & { pk: number }>(
      MACHINE,
      { a: { icon: 'x', translate }, b: { icon: 'y', translate } },
      mockApi as any
    )
    const events = sm.getAvailableEvents({ pk: 1, state: 'a' }, t)
    expect(events[0].disabled).toBe(true)
    expect(events[0].reason).toContain('Not allowed')
  })
})

// ─── registerGuard / checkGuards ─────────────────────────────────────────────

describe('checkGuards', () => {
  beforeEach(() => loadMachines())

  test('returns undefined when no guards registered', () => {
    const { checkGuards } = makeSM()
    expect(checkGuards({ pk: 1, state: 'draft' }, 'start', t)).toBeUndefined()
  })

  test('returns guard trigger when guard fires', () => {
    const { registerGuard, checkGuards } = makeSM()
    registerGuard('start', () => ({ text: 'Are you sure?' }))
    const result = checkGuards({ pk: 1, state: 'draft' }, 'start', t)
    expect(result?.text).toBe('Are you sure?')
  })

  test('wildcard guard applies to all events', () => {
    const { registerGuard, checkGuards } = makeSM()
    registerGuard('*' as Event, () => ({ text: 'Global warning' }))
    expect(checkGuards({ pk: 1, state: 'draft' }, 'start', t)?.text).toBe(
      'Global warning'
    )
    expect(checkGuards({ pk: 1, state: 'ongoing' }, 'close', t)?.text).toBe(
      'Global warning'
    )
  })

  test('blocking guard takes priority over non-blocking', () => {
    const { registerGuard, checkGuards } = makeSM()
    registerGuard('start', () => ({ text: 'Soft warning' }))
    registerGuard('start', () => ({ text: 'Hard block', isBlocking: true }))
    const result = checkGuards({ pk: 1, state: 'draft' }, 'start', t)
    expect(result?.isBlocking).toBe(true)
    expect(result?.text).toBe('Hard block')
  })
})

// ─── sendEvent ────────────────────────────────────────────────────────────────

describe('sendEvent', () => {
  beforeEach(async () => {
    await loadMachines()
    mockApi.action.mockReset()
    mockApi.action.mockResolvedValue({})
    vi.mocked(dialogQuery).mockReset()
  })

  test('fires action immediately when no guards', async () => {
    const { sendEvent } = makeSM()
    await sendEvent({ pk: 1, state: 'draft' }, 'start', t)
    expect(mockApi.action).toHaveBeenCalledWith('event', 1, { event: 'start' })
  })

  test('fires action when user confirms non-blocking guard', async () => {
    const { registerGuard, sendEvent } = makeSM()
    registerGuard('start', () => ({ text: 'Confirm?' }))
    vi.mocked(dialogQuery).mockResolvedValueOnce(true)
    await sendEvent({ pk: 1, state: 'draft' }, 'start', t)
    expect(mockApi.action).toHaveBeenCalled()
  })

  test('does not fire when user cancels non-blocking guard', async () => {
    const { registerGuard, sendEvent } = makeSM()
    registerGuard('start', () => ({ text: 'Confirm?' }))
    vi.mocked(dialogQuery).mockResolvedValueOnce(false)
    await sendEvent({ pk: 1, state: 'draft' }, 'start', t)
    expect(mockApi.action).not.toHaveBeenCalled()
  })

  test('does not fire when blocking guard triggers', async () => {
    const { registerGuard, sendEvent } = makeSM()
    registerGuard('start', () => ({ text: 'Blocked', isBlocking: true }))
    await sendEvent({ pk: 1, state: 'draft' }, 'start', t)
    expect(mockApi.action).not.toHaveBeenCalled()
  })
})

// ─── registerValidator (module-level) ────────────────────────────────────────

describe('registerValidator', () => {
  test('registered validator is used in getAvailableEvents', async () => {
    const MACHINE = 'rv_machine'
    registerValidator(MACHINE, 'always_fail', () => 'always fails')
    vi.mocked(restApi.get).mockResolvedValueOnce({
      [MACHINE]: {
        name: MACHINE,
        states: { a: { name: 'A' }, b: { name: 'B' } },
        events: {
          go: {
            name: 'Go',
            transitions: [
              { cond: [], from: 'a', to: 'b', validators: ['always_fail'] }
            ]
          }
        }
      }
    })
    await fetchStateMachines()
    const sm = useStateMachine<StateContent & { pk: number }>(
      MACHINE,
      { a: { icon: 'x', translate }, b: { icon: 'y', translate } },
      mockApi as any
    )
    const events = sm.getAvailableEvents({ pk: 1, state: 'a' }, t)
    expect(events[0].disabled).toBe(true)
  })
})
