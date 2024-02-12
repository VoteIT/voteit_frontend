import { meetingSettingsPlugins } from '../meetings/registry'
import { proposalButtonPlugins } from '../proposals/registry'

import ControlPanel from './ControlPanel.vue'
import ProposalButtons from './ProposalButtons.vue'
import QuickPanel from './QuickPanel.vue'
import useReactions from './useReactions'

const { getMeetingButtons } = useReactions()

meetingSettingsPlugins.register({
  id: 'reactions',
  component: ControlPanel,
  quickComponent: QuickPanel,
  icon: 'mdi-thumb-up',
  getTitle(t) {
    return t('reaction.buttons')
  }
})

proposalButtonPlugins.register({
  id: 'reactions',
  checkActive(meeting, mode) {
    return !!getMeetingButtons(meeting.pk, undefined, mode).length
  },
  component: ProposalButtons
})
