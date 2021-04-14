import { MeetingRole, WorkflowState } from '../types'

export enum AgendaState {
  Private = 'private',
  Upcoming = 'upcoming',
  Ongoing = 'ongoing',
  Closed = 'closed',
  Archived = 'archived'
}

const states: WorkflowState[] = [
  {
    transition: 'unpublish',
    icon: 'mdi-eye-off',
    state: AgendaState.Private,
    priority: 4,
    requiresRole: MeetingRole.Moderator
  },
  {
    transition: 'upcoming',
    icon: 'mdi-pause',
    state: AgendaState.Upcoming,
    priority: 2
  },
  {
    transition: 'ongoing',
    icon: 'mdi-play',
    state: AgendaState.Ongoing,
    priority: 1
  },
  {
    transition: 'close',
    icon: 'mdi-close',
    state: AgendaState.Closed,
    priority: 3
  },
  {
    transition: 'archive',
    icon: 'mdi-archive',
    state: AgendaState.Archived
  }
]

export default states
