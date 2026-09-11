import { expect, test, vi } from 'vitest'

import { AgendaItem, AgendaState } from '../agendas/types'
import { Meeting, MeetingState } from '../meetings/types'

import { meetingAndAiOngoing } from './rules'

const { meetings } = vi.hoisted(() => ({
  meetings: new Map<number, Pick<Meeting, 'pk' | 'state'>>()
}))

vi.mock('@/socket', () => ({
  socket: {
    registerTypeHandler: vi.fn(),
    onReadyStateChanged: vi.fn(),
    receive: vi.fn()
  }
}))
vi.mock('../meetings/useMeetingStore', () => ({
  default: () => ({ getMeeting: (pk: number) => meetings.get(pk) })
}))

const MEETING = 10

function agendaItemIn(
  meetingState: MeetingState | undefined,
  state: AgendaState
) {
  meetings.clear()
  if (meetingState) meetings.set(MEETING, { pk: MEETING, state: meetingState })
  return { pk: 1, meeting: MEETING, state } as AgendaItem
}

test('a poll can be started when both meeting and agenda item are ongoing', () => {
  expect(
    meetingAndAiOngoing(agendaItemIn(MeetingState.Ongoing, AgendaState.Ongoing))
  ).toBe(true)
})

test.each([AgendaState.Private, AgendaState.Upcoming, AgendaState.Closed])(
  'not in an agenda item that is %s',
  (state) => {
    expect(meetingAndAiOngoing(agendaItemIn(MeetingState.Ongoing, state))).toBe(
      false
    )
  }
)

// The agenda item stays ongoing when the meeting goes back to upcoming or closes
test.each([MeetingState.Upcoming, MeetingState.Closed, undefined])(
  'not in an ongoing agenda item when the meeting is %s',
  (meetingState) => {
    expect(
      meetingAndAiOngoing(agendaItemIn(meetingState, AgendaState.Ongoing))
    ).toBe(false)
  }
)
