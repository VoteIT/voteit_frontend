import { beforeEach, expect, test, vi } from 'vitest'

import { AccessPolicy, AccessPolicyType } from '@/contentTypes/types'
import { ApiError } from '@/utils/restApi'

import { MeetingInvite } from '../meetingInvites/types'
import { canJoinMeeting, checkCanJoinMeeting } from './joinRules'
import { canBecomeModerator } from './rules'

const { auth, inviteStore, mockRetrieve } = vi.hoisted(() => ({
  auth: { user: { pk: 1 } as { pk: number } | null },
  inviteStore: {
    matchedInvites: [] as Partial<
      import('../meetingInvites/types').MeetingInvite
    >[],
    fetchMatchedInvites: vi.fn()
  },
  mockRetrieve: vi.fn()
}))

vi.mock('./rules', () => ({ canBecomeModerator: vi.fn() }))
vi.mock('../auth/useAuthStore', () => ({ default: () => auth }))
vi.mock('../meetingInvites/useInviteStore', () => ({
  default: () => inviteStore
}))
vi.mock('./contentTypes', () => ({
  accessPolicyType: { api: { retrieve: mockRetrieve } }
}))

const MEETING = 7

const invite = (meeting: number, meeting_title?: string) =>
  ({ pk: meeting * 10, meeting, meeting_title }) as MeetingInvite

const policy = (active: boolean) =>
  ({
    pk: 1,
    meeting: MEETING,
    active,
    name: AccessPolicyType.Automatic,
    roles_given: []
  }) as AccessPolicy

beforeEach(() => {
  vi.mocked(canBecomeModerator).mockReturnValue(false)
  auth.user = { pk: 1 }
  inviteStore.matchedInvites = []
  inviteStore.fetchMatchedInvites.mockReset().mockResolvedValue(undefined)
  mockRetrieve.mockReset().mockResolvedValue({ pk: MEETING, policies: [] })
})

test('canJoinMeeting accepts any one way in', () => {
  const none = { invites: [], policies: [] }
  expect(canJoinMeeting(MEETING, none)).toBe(false)
  // An invitation to another meeting is no way into this one
  expect(canJoinMeeting(MEETING, { ...none, invites: [invite(8)] })).toBe(false)
  expect(canJoinMeeting(MEETING, { ...none, invites: [invite(MEETING)] })).toBe(
    true
  )
  expect(canJoinMeeting(MEETING, { ...none, policies: [policy(false)] })).toBe(
    false
  )
  expect(canJoinMeeting(MEETING, { ...none, policies: [policy(true)] })).toBe(
    true
  )
  vi.mocked(canBecomeModerator).mockReturnValue(true)
  expect(canJoinMeeting(MEETING, none)).toBe(true)
})

test('an organisation manager needs no fetches', async () => {
  vi.mocked(canBecomeModerator).mockReturnValue(true)
  expect(await checkCanJoinMeeting(MEETING)).toEqual({})
  expect(inviteStore.fetchMatchedInvites).not.toHaveBeenCalled()
  expect(mockRetrieve).not.toHaveBeenCalled()
})

test('an invitation lets us in and carries the title', async () => {
  inviteStore.fetchMatchedInvites.mockImplementation(async () => {
    inviteStore.matchedInvites = [invite(8), invite(MEETING, 'Annual meeting')]
  })
  expect(await checkCanJoinMeeting(MEETING)).toEqual({
    title: 'Annual meeting'
  })
  expect(mockRetrieve).not.toHaveBeenCalled()
})

test('an active access policy lets us in', async () => {
  mockRetrieve.mockResolvedValue({ pk: MEETING, policies: [policy(true)] })
  expect(await checkCanJoinMeeting(MEETING)).toEqual({})
})

test('no way in, or failures finding one, resolve to undefined', async () => {
  mockRetrieve.mockRejectedValue(
    new ApiError(404, {}, new Headers(), '404 Not Found')
  )
  expect(await checkCanJoinMeeting(MEETING)).toBeUndefined()

  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  inviteStore.fetchMatchedInvites.mockRejectedValue(new Error('offline'))
  mockRetrieve.mockRejectedValue(new Error('offline'))
  expect(await checkCanJoinMeeting(MEETING)).toBeUndefined()
  warn.mockRestore()
})

test('a signed out user has no way in', async () => {
  auth.user = null
  expect(await checkCanJoinMeeting(MEETING)).toBeUndefined()
  expect(inviteStore.fetchMatchedInvites).not.toHaveBeenCalled()
})
