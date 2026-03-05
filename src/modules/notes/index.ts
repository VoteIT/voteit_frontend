import { meetingSettingsPlugins } from '../meetings/registry'
import { Meeting } from '../meetings/types'
import useMeetingComponent from '../meetings/useMeetingComponent'
import { proposalButtonPlugins } from '../proposals/registry'

import ControlPanel from './ControlPanel.vue'
import ProposalNoteButton from './ProposalNoteButton.vue'

const COMPONENT_ID = 'notes'

function checkActive(meeting: Meeting) {
  return useMeetingComponent(meeting.pk, COMPONENT_ID).componentActive.value
}

meetingSettingsPlugins.register({
  id: COMPONENT_ID,
  icon: 'mdi-note-plus',
  quickComponent: ControlPanel,
  getTitle(t) {
    return t('notes.title', 2)
  }
})

proposalButtonPlugins.register({
  id: COMPONENT_ID,
  checkActive,
  component: ProposalNoteButton
})
