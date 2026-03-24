import { any, filter } from 'itertools'
import { meetingSettingsPlugins } from '../meetings/registry'
import { plenarySuggestions } from '../plenary/registry'
import { proposalButtonPlugins } from '../proposals/registry'

import ControlPanel from './ControlPanel.vue'
import PlenarySuggestions from './PlenarySuggestions.vue'
import ProposalButtons from './ProposalButtons.vue'
import QuickPanel from './QuickPanel.vue'
import useReactionStore from './useReactionStore'

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
  // @ts-ignore  Don't know how to type this
  getComponent(proposals) {
    const store = useReactionStore()
    const meeting = proposals[0].m
    const buttons = filter(
      store.iterMeetingButtons(meeting, 'proposal'),
      (b) =>
        b.flag_mode &&
        proposals.some((prop) =>
          store.getButtonReactionCount(b, {
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
