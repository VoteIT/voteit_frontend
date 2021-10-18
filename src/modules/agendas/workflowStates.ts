import { WorkflowState } from '@/contentTypes/types'
import { MeetingRole } from '@/modules/meetings/types'

import { AgendaState } from './types'

export const agendaItemStates: WorkflowState[] = [
  {
    transition: 'unpublish',
    icon: 'mdi-eye-off',
    state: AgendaState.Private,
    priority: 4,
    requiresRole: MeetingRole.Moderator
  },
  {
    transition: 'upcoming',
    icon: 'mdi-progress-clock',
    state: AgendaState.Upcoming,
    priority: 2
  },
  {
    transition: 'ongoing',
    icon: 'mdi-play-circle',
    state: AgendaState.Ongoing,
    priority: 1
  },
  {
    transition: 'close',
    icon: 'mdi-close-circle-outline',
    state: AgendaState.Closed,
    priority: 3
  },
  {
    // Transition not user accessible
    // transition: 'archive',
    icon: 'mdi-archive',
    state: AgendaState.Archived
  }
]
