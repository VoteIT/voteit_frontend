import { meetingBubblePlugins, meetingSettingsPlugins } from '../meetings/registry'
import useMeeting from '../meetings/useMeeting'
import useMeetingComponent from '../meetings/useMeetingComponent'

import PresenceCheckBubble from './PresenceCheckBubble.vue'
import usePresence from './usePresence'

import QuickPanel from './QuickPanel.vue'
import { computed, toRef } from 'vue'

meetingSettingsPlugins.register({
  id: 'presence',
  icon: 'mdi-hand-wave',
  isDisabled (meeting) {
    return meeting.dialect?.block_components?.includes('presence_check') ?? false
  },
  getTitle (t) {
    return t('presence.check')
  },
  quickComponent: QuickPanel
})

meetingBubblePlugins.register({
  id: 'presence_check',
  component: PresenceCheckBubble,
  icon: 'mdi-hand-wave',
  order: 10,
  checkActive (meeting) {
    const meetingId = toRef(meeting, 'pk')
    if (!usePresence(meetingId).presenceCheck.value) return false
    return useMeetingComponent(meetingId, 'presence_check').componentActive.value
  },
  requireAttention: computed(() => {
    const { meetingId } = useMeeting()
    const { isPresent, presenceCheck } = usePresence(meetingId)
    return !!presenceCheck.value && !isPresent.value
  })
})
