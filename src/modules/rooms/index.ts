import { any } from 'itertools'
import { computed } from 'vue'

import router from '@/router'
import {
  meetingBubblePlugins,
  meetingSettingsPlugins
} from '../meetings/registry'

import ControlPanel from './ControlPanel.vue'
import RealTimeBubble from './RealTimeBubble.vue'
import RealTimeView from './RealTimeView.vue'
import { meetingRoomStore } from './useRooms'

meetingSettingsPlugins.register({
  id: 'rooms',
  component: ControlPanel,
  icon: 'mdi-lecturn',
  getTitle(t) {
    return t('room.settingsTitle')
  },
  getDescription(t) {
    return t('room.settingsDescription')
  }
})

meetingBubblePlugins.register({
  id: 'presence_check',
  component: RealTimeBubble,
  icon: 'mdi-television-play',
  order: 10,
  checkActive(meeting) {
    return any(
      meetingRoomStore.values(),
      (r) => r.meeting === meeting.pk && r.open
    )
  },
  requireAttention: computed(() => false)
})

router.addRoute({
  component: RealTimeView,
  name: 'room:main',
  path: '/room/:id/:roomId'
})
