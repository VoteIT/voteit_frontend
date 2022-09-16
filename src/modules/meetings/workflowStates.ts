import { WorkflowState } from '@/contentTypes/types'
import { MeetingComponentState, MeetingInviteState, MeetingState } from './types'

export const meetingStates: WorkflowState<MeetingState>[] = [
  {
    transition: 'upcoming',
    icon: 'mdi-progress-clock',
    state: MeetingState.Upcoming
  },
  {
    transition: 'ongoing',
    icon: 'mdi-play-circle',
    state: MeetingState.Ongoing
  },
  {
    transition: 'close',
    icon: 'mdi-close-circle-outline',
    state: MeetingState.Closed
  },
  {
    transition: 'request_archiving',
    icon: 'mdi-archive',
    state: MeetingState.Archiving
  },
  {
    transition: 'archive',
    icon: 'mdi-archive',
    state: MeetingState.Archived,
    isFinal: true
  }
]

export const meetingInviteStates: WorkflowState<MeetingInviteState>[] = [
  {
    icon: 'mdi-todo', // TODO
    state: MeetingInviteState.Open
  },
  {
    transition: 'accept',
    icon: 'mdi-check',
    state: MeetingInviteState.Accepted,
    isFinal: true
  },
  {
    transition: 'reject',
    icon: 'mdi-cancel',
    state: MeetingInviteState.Rejected,
    isFinal: true
  },
  {
    transition: 'revoke',
    icon: 'mdi-undo',
    state: MeetingInviteState.Revoked,
    isFinal: true
  },
  {
    icon: 'mdi-clock-alert',
    state: MeetingInviteState.Expired,
    isFinal: true
  }
]

export const meetingComponentStates: WorkflowState<MeetingComponentState>[] = [
  {
    icon: 'mdi-todo', // TODO
    state: MeetingComponentState.Off,
    transition: 'disable'
  },
  {
    icon: 'mdi-todo', // TODO
    state: MeetingComponentState.On,
    transition: 'enable'
  }
]
