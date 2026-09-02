import { beforeEach, expect, test, vi } from 'vitest'
import { computed, effect } from 'vue'

import { ContextRoles } from '@/composables/types'

import { Meeting, MeetingRole } from './types'
import { canViewMeeting, hasMeetingRole, isModerator } from './rules'

const { mockRegisterTypeHandler } = vi.hoisted(() => ({
  mockRegisterTypeHandler: vi.fn()
}))

vi.mock('@/socket', () => ({
  socket: {
    registerTypeHandler: mockRegisterTypeHandler,
    onReadyStateChanged: vi.fn(),
    receive: vi.fn()
  }
}))
vi.mock('@/modules/auth/useAuthStore', () => ({
  default: () => ({ isAnonymous: false, user: { pk: USER } })
}))

const MEETING = 10
const USER = 1

// Roles reach the store the same way they do in the app: over the socket
const socketHandler = mockRegisterTypeHandler.mock.calls.find(
  ([name]) => name === 'roles'
)![1] as (msg: { action: string; payload: ContextRoles }) => void

function sendRoles(action: 'changed' | 'removed', ...roles: MeetingRole[]) {
  socketHandler({
    action,
    payload: { model: 'Meeting', pk: MEETING, user_pk: USER, roles }
  })
}

/** A meeting object as the store holds it - only the pk is read here. */
const meeting = { pk: MEETING } as Meeting

beforeEach(() => {
  sendRoles('removed', ...Object.values(MeetingRole))
})

test('a loaded meeting with no roles answers false, not undefined', () => {
  // The distinction usePermission turns on: it acts on `false` alone, so an
  // `undefined` here would let a revoked role pass for "don't know yet".
  expect(hasMeetingRole(meeting, MeetingRole.Participant)).toBe(false)
  expect(isModerator(meeting)).toBe(false)
  expect(canViewMeeting(meeting)).toBe(false)
})

test('an unloaded meeting still answers undefined', () => {
  // meetingRequirement's channel-swap watcher reads this as "not in the store
  // for a moment" rather than as a role change, so it has to stay a tri-state.
  expect(hasMeetingRole(undefined, MeetingRole.Moderator)).toBeUndefined()
  expect(isModerator(undefined)).toBeUndefined()
})

test('losing the last role flips canViewMeeting from true to false', () => {
  sendRoles('changed', MeetingRole.Participant)

  const permission = computed(() => canViewMeeting(meeting))
  const seen: (boolean | undefined)[] = []
  effect(() => seen.push(permission.value))
  expect(seen).toEqual([true])

  sendRoles('removed', MeetingRole.Participant)

  // Exactly false, and reached in one step - so usePermission's watch fires
  // and still sees `true` as the previous value, which is what picks the
  // "your access was revoked" message over the generic one.
  expect(seen).toEqual([true, false])
})

test('losing one role of several leaves the rest answering', () => {
  sendRoles('changed', MeetingRole.Participant, MeetingRole.Moderator)
  sendRoles('removed', MeetingRole.Moderator)

  expect(isModerator(meeting)).toBe(false)
  expect(canViewMeeting(meeting)).toBe(true)
})
