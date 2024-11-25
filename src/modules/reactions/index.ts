import { meetingSettingsPlugins } from '../meetings/registry'
import { plenarySuggestions } from '../plenary/registry'
import { proposalButtonPlugins } from '../proposals/registry'

import ControlPanel from './ControlPanel.vue'
import PlenarySuggestions from './PlenarySuggestions.vue'
import ProposalButtons from './ProposalButtons.vue'
import QuickPanel from './QuickPanel.vue'
import useReactions from './useReactions'

const { getMeetingButtons, getButtonReactionCount } = useReactions()

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

plenarySuggestions.register({
  // @ts-ignore  Don't know how to type this
  getComponent(proposals) {
    const meeting = proposals[0].m
    const buttons = getMeetingButtons(meeting, 'proposal').filter(
      (b) =>
        b.flag_mode &&
        proposals.some((prop) =>
          getButtonReactionCount(b, {
            content_type: 'proposal',
            object_id: prop.pk
          })
        )
    )
    return {
      component: PlenarySuggestions,
      props: { buttons, proposals }
    }
  },
  getTitle(t) {
    return t('reaction.flags', 2)
  }
})
