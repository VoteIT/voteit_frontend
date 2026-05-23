import { any, filter } from 'itertools'
import { meetingSettingsPlugins } from '../meetings/registry'
import { plenarySuggestions } from '../plenary/registry'
import { proposalButtonPlugins } from '../proposals/registry'

import ControlPanel from './ControlPanel.vue'
import PlenarySuggestions from './PlenarySuggestions.vue'
import ProposalButtons from './ProposalButtons.vue'
import QuickPanel from './QuickPanel.vue'
import useReactionStore from './useReactionStore'
import { type IFlagButton, isFlagButton } from './types'

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
    return any(
      useReactionStore().iterMeetingButtons(meeting.pk, undefined, mode)
    )
  },
  component: ProposalButtons
})

plenarySuggestions.register({
  getComponent(proposals) {
    const store = useReactionStore()
    const meeting = proposals[0].m
    const buttons = filter(
      store.iterMeetingButtons(meeting, 'proposal'),
      (b) =>
        isFlagButton(b) &&
        proposals.some((prop) =>
          store.getButtonReactionCount(b, {
            content_type: 'proposal',
            object_id: prop.pk
          })
        )
    ) as IFlagButton[]
    if (buttons.length)
      return {
        component: PlenarySuggestions,
        props: { buttons, proposals }
      }
  },
  getTitle(t) {
    return t('reaction.flags', 2)
  }
})
