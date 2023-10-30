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
  icon: 'mdi-door',
  getTitle(t) {
    return t('room.rooms')
  }
})

meetingBubblePlugins.register({
  id: 'presence_check',
  component: RealTimeBubble,
  icon: 'mdi-broadcast',
  order: 10,
  checkActive() {
    return any(meetingRoomStore.values(), (r) => r.active)
  },
  requireAttention: computed(() => true)
})

router.addRoute({
  component: RealTimeView,
  name: 'rooms:main',
  path: '/room/:id/:roomId'
})
