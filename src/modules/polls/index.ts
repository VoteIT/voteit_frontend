import { noValidation, registerValidator } from '@/composables/useStateMachine'
import { meetingBubblePlugins } from '../meetings/registry'

import UnvotedPollsBubble from './UnvotedPollsBubble.vue'
import usePollStore from './usePollStore'
import { Poll } from './types'
import { canStartPoll } from './rules'
import useAgendaStore from '../agendas/useAgendaStore'

meetingBubblePlugins.register({
  component: UnvotedPollsBubble,
  icon: 'mdi-vote',
  id: 'unvotedPolls',
  order: 0,
  requireAttention: true,
  checkActive(meeting) {
    return !!usePollStore().getNextUnvotedPoll(meeting.pk)
  }
})

const MACHINE = 'PollStateMachine'
registerValidator(MACHINE, 'has_change_state_permission', noValidation) // Change permission will already be checked
registerValidator(MACHINE, 'manual_er_not_needed', noValidation)
registerValidator(MACHINE, 'validate_er_policy', noValidation)
registerValidator(MACHINE, 'validate_method', noValidation)
registerValidator(MACHINE, 'validate_settings', noValidation)
registerValidator(MACHINE, 'meeting_and_ai_ongoing', (poll: Poll, t) => {
  const agendaItem = useAgendaStore().getAgendaItem(poll.agenda_item)
  return (
    (!!agendaItem && canStartPoll(agendaItem)) ||
    t('poll.meetingAndAgendaMustBeOngoing')
  )
})
