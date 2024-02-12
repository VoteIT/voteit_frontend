import { WorkflowStates } from '@/contentTypes/types'
import { MeetingRole } from '@/modules/meetings/types'

import { AgendaState, AgendaTransition } from './types'

export const agendaItemStates: WorkflowStates<AgendaState, AgendaTransition> = [
  {
    transition: AgendaTransition.Unpublish,
    icon: 'mdi-eye-off',
    state: AgendaState.Private,
    priority: 4,
    requiresRole: MeetingRole.Moderator,
    getName(t, count = 1) {
      return t('agenda.workflow.private', count)
    }
  },
  {
    transition: AgendaTransition.Upcoming,
    icon: 'mdi-progress-clock',
    state: AgendaState.Upcoming,
    priority: 2,
    getName(t, count = 1) {
      return t('agenda.workflow.upcoming', count)
    }
  },
  {
    transition: AgendaTransition.Ongoing,
    icon: 'mdi-play-circle',
    state: AgendaState.Ongoing,
    priority: 1,
    getName(t, count = 1) {
      return t('agenda.workflow.ongoing', count)
    }
  },
  {
    transition: AgendaTransition.Close,
    icon: 'mdi-check-all',
    state: AgendaState.Closed,
    priority: 3,
    getName(t, count = 1) {
      return t('agenda.workflow.closed', count)
    }
  },
  {
    // Transition not user accessible
    // transition: 'archive',
    icon: 'mdi-archive',
    state: AgendaState.Archived,
    getName(t, count = 1) {
      return t('agenda.workflow.archived', count)
    }
  }
]
