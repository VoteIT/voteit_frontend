import { WorkflowState } from '../types'

export enum MeetingState {
  Upcoming = 'upcoming',
  Ongoing = 'ongoing',
  Closed = 'closed',
  Archiving = 'archiving',
  Archived = 'archived'
}

export default [
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
    state: MeetingState.Archiving,
    isFinal: true
  },
  {
    transition: 'archive',
    icon: 'mdi-archive',
    state: MeetingState.Archived,
    isFinal: true
  }
] as WorkflowState[]
