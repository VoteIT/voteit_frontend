import { beforeEach, expect, test, vi } from 'vitest'
import { computed, effect } from 'vue'

import { ContextRoles } from './types'
// Importing the module registers the 'roles' content type as a side effect
import useContextRoles from './useContextRoles'

const { mockAddTypeHandler } = vi.hoisted(() => ({
  mockAddTypeHandler: vi.fn()
}))

vi.mock('@/utils/Socket', () => ({
  socket: { addTypeHandler: mockAddTypeHandler }
}))
vi.mock('@/modules/auth/useAuthStore', () => ({
  default: () => ({ user: { pk: 1 } })
}))

// Other content types are registered by transitive imports, so find ours by name
const socketHandler = mockAddTypeHandler.mock.calls.find(
  ([name]) => name === 'roles'
)![1] as (msg: { t: string; p: ContextRoles }) => void

function send(method: 'added' | 'removed', payload: ContextRoles) {
  socketHandler({ t: `roles.${method}`, p: payload })
}

const MEETING = 10
const USER = 1

beforeEach(() => {
  // Clear any roles left by a previous test
  useContextRoles('meeting').set(MEETING, USER, [])
})

test('registers a socket handler for the roles content type', () => {
  expect(mockAddTypeHandler).toHaveBeenCalledWith('roles', expect.any(Function))
})

test('added/removed role events trigger reactive effects', () => {
  const { hasRole } = useContextRoles<'moderator' | 'participant'>('meeting')
  const isModerator = computed(() => !!hasRole(MEETING, 'moderator'))

  let runs = 0
  effect(() => {
    runs++
    isModerator.value
  })

  expect(isModerator.value).toBe(false)
  expect(runs).toBe(1)

  send('added', {
    model: 'Meeting',
    pk: MEETING,
    user_pk: USER,
    roles: ['moderator']
  })
  expect(isModerator.value).toBe(true)
  expect(runs).toBe(2)

  // Adding a second role to an existing role store must still invalidate effects.
  // This is what in-place Set mutation would silently fail to do.
  const isParticipant = computed(() => !!hasRole(MEETING, 'participant'))
  let participantRuns = 0
  effect(() => {
    participantRuns++
    isParticipant.value
  })
  expect(isParticipant.value).toBe(false)
  expect(participantRuns).toBe(1)

  send('added', {
    model: 'Meeting',
    pk: MEETING,
    user_pk: USER,
    roles: ['participant']
  })
  expect(isParticipant.value).toBe(true)
  expect(participantRuns).toBe(2)
  expect(isModerator.value).toBe(true)

  send('removed', {
    model: 'Meeting',
    pk: MEETING,
    user_pk: USER,
    roles: ['moderator']
  })
  expect(isModerator.value).toBe(false)
  expect(hasRole(MEETING, 'participant')).toBe(true)
})

test('removing the last role drops the role store and triggers effects', () => {
  const { hasRole, getUserRoles } = useContextRoles<'moderator'>('meeting')
  send('added', {
    model: 'Meeting',
    pk: MEETING,
    user_pk: USER,
    roles: ['moderator']
  })

  const isModerator = computed(() => !!hasRole(MEETING, 'moderator'))
  let runs = 0
  effect(() => {
    runs++
    isModerator.value
  })
  expect(isModerator.value).toBe(true)

  send('removed', {
    model: 'Meeting',
    pk: MEETING,
    user_pk: USER,
    roles: ['moderator']
  })
  expect(isModerator.value).toBe(false)
  expect(getUserRoles(MEETING)).toBeUndefined()
  expect(runs).toBe(2)
})

test('removed events for unknown contexts are ignored', () => {
  const { getUserRoles } = useContextRoles('meeting')
  send('removed', {
    model: 'Meeting',
    pk: 999,
    user_pk: USER,
    roles: ['moderator']
  })
  expect(getUserRoles(999)).toBeUndefined()
})
