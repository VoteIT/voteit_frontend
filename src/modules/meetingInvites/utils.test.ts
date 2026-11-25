import { expect, test } from 'vitest'

import { MeetingInvite } from './types'
import { MeetingState } from '../meetings/types'
import { groupUsedInvites, mergeAccountMeetings } from './utils'

function invite(
  pk: number,
  accountPk: number | null,
  switchTo: number | null = null
): MeetingInvite {
  return {
    pk,
    meeting: pk * 10,
    used_elsewhere: true,
    switch_to: switchTo,
    used_by_account: accountPk && {
      pk: accountPk,
      first_name: 'Je*',
      last_name: 'Å*',
      last_login: null
    }
  } as MeetingInvite
}

function summary(groups: ReturnType<typeof groupUsedInvites>['others']) {
  return groups.map((g) => [g.account.pk, g.invites.map((i) => i.pk)])
}

test('switchable accounts get one group each', () => {
  const { switchable, others } = groupUsedInvites([
    invite(1, 5, 5),
    invite(2, 5, 5),
    invite(3, 6, 6)
  ])
  expect(summary(switchable)).toEqual([
    [5, [1, 2]],
    [6, [3]]
  ])
  expect(others).toEqual([])
})

test('accounts the user cannot switch to are grouped too', () => {
  const { switchable, others } = groupUsedInvites([
    invite(1, 7),
    invite(2, 8),
    invite(3, 7)
  ])
  expect(switchable).toEqual([])
  expect(summary(others)).toEqual([
    [7, [1, 3]],
    [8, [2]]
  ])
})

test('mixed invites keep their order of first appearance', () => {
  const { switchable, others } = groupUsedInvites([
    invite(1, 7),
    invite(2, 5, 5),
    invite(3, 8),
    invite(4, 7),
    invite(5, 5, 5)
  ])
  expect(summary(switchable)).toEqual([[5, [2, 5]]])
  expect(summary(others)).toEqual([
    [7, [1, 4]],
    [8, [3]]
  ])
})

test('invites without an account are left out', () => {
  const { switchable, others } = groupUsedInvites([invite(1, null)])
  expect(switchable).toEqual([])
  expect(others).toEqual([])
})

test('mergeAccountMeetings lists invited meetings first, each once', () => {
  const inv = (meeting: number, title: string) =>
    ({ meeting, meeting_title: title }) as MeetingInvite
  const merged = mergeAccountMeetings({
    account: {
      pk: 5,
      first_name: 'Jens',
      last_name: 'Ås',
      last_login: null,
      meetings: [
        { pk: 1, title: 'A', state: MeetingState.Ongoing },
        { pk: 2, title: 'B', state: MeetingState.Upcoming }
      ],
      meeting_count: 4
    },
    invites: [inv(2, 'B'), inv(3, 'C')]
  })
  expect(merged).toEqual([
    { pk: 2, title: 'B', state: MeetingState.Upcoming },
    // Not among the meetings the server sent, so the state is unknown
    { pk: 3, title: 'C', state: undefined },
    { pk: 1, title: 'A', state: MeetingState.Ongoing }
  ])
})
