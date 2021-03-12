import { MeetingRole } from '../types'

export enum AgendaState {
  Private = 'private',
  Upcoming = 'upcoming',
  Ongoing = 'ongoing',
  Closed = 'closed',
  Archived = 'archived'
}

export default [
  {
    transition: 'unpublish',
    icon: 'mdi-eye-off',
    state: AgendaState.Private,
    requiresRole: MeetingRole.Moderator
  },
  {
    transition: 'upcoming',
    icon: 'mdi-pause',
    state: AgendaState.Upcoming
  },
  {
    transition: 'ongoing',
    icon: 'mdi-play',
    state: AgendaState.Ongoing
  },
  {
    transition: 'close',
    icon: 'mdi-close',
    state: AgendaState.Closed
  },
  {
    transition: 'archive',
    icon: 'mdi-archive',
    state: AgendaState.Archived
  }
]
