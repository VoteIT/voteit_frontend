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
    icon: 'visibility_off',
    state: AgendaState.Private,
    requiresRole: MeetingRole.Moderator
  },
  {
    transition: 'upcoming',
    icon: 'pause',
    state: AgendaState.Upcoming
  },
  {
    transition: 'ongoing',
    icon: 'play_arrow',
    state: AgendaState.Ongoing
  },
  {
    transition: 'close',
    icon: 'close',
    state: AgendaState.Closed
  },
  {
    transition: 'archive',
    icon: 'archive',
    state: AgendaState.Archived
  }
]
