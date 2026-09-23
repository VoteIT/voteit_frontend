import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, test, vi } from 'vitest'

const { mockRegisterTypeHandler } = vi.hoisted(() => ({
  mockRegisterTypeHandler: vi.fn()
}))

vi.mock('@/socket', () => ({
  socket: { registerTypeHandler: mockRegisterTypeHandler }
}))

// First, as in main.ts: ContentType, useContextRoles and the organisation
// content types form a cycle, and entering it anywhere else leaves ContentType
// half evaluated. See the "Import order important!" note in useAuthStore.
import '@/modules/auth/useAuthStore'

import useSpeakerStore from './useSpeakerStore'
import { Speaker } from './types'

// Other content types are registered by transitive imports, so find ours by name
const socketHandler = mockRegisterTypeHandler.mock.calls.find(
  ([name]) => name === 'speaker'
)![1] as (msg: { action: string; payload: object }) => void

let nextPk = 1

/**
 * What the backend sends on the room channel. Only 'changed', as in useOrgStore.test.ts:
 * the 'added' handler stays bound to the store of the first pinia.
 */
function send(speaker: Partial<Speaker>) {
  socketHandler({
    action: 'changed',
    payload: {
      pk: nextPk++,
      room: 1,
      speaker_list: 1,
      started: null,
      seconds: null,
      ...speaker
    }
  })
}

let minute = 0

/**
 * A finished speech, started a minute after the one before
 */
function spoke(user: number, speaker_list = 1) {
  const started = `2026-01-01T10:${String(minute++).padStart(2, '0')}:00`
  send({ user, speaker_list, started, seconds: 30 })
}

beforeEach(() => {
  setActivePinia(createPinia())
})

test('timesSpokenGetter counts finished speeches per user on the list', () => {
  const store = useSpeakerStore()
  // Interleaved, so that no user's speeches are all next to each other
  for (const user of [10, 10, 20, 10, 20, 10, 30]) spoke(user)
  // Not finished speeches: queued, and speaking right now
  send({ user: 20 })
  send({ user: 20, started: '2026-01-01T11:00:00' })
  // Another list
  spoke(20, 2)

  const getSpoken = store.timesSpokenGetter(1)
  expect(getSpoken(10)).toBe(4)
  expect(getSpoken(20)).toBe(2)
  expect(getSpoken(30)).toBe(1)
  expect(getSpoken(40)).toBe(0)
  expect(store.timesSpokenGetter(2)(20)).toBe(1)
  expect(store.timesSpokenGetter(3)(10)).toBe(0)
})
