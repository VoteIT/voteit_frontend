import router from '@/router'
import {
  meetingBubblePlugins,
  meetingSettingsPlugins
} from '../meetings/registry'
import { meetingRequirement } from '../meetings/requirements'

import { roomRequirement } from './requirements'
import ControlPanel from './ControlPanel.vue'
import RealTimeBubble from './RealTimeBubble.vue'
import RealTimeView from './RealTimeView.vue'
import userRoomStore from './useRoomStore'
import QuickPanel from './QuickPanel.vue'

meetingSettingsPlugins.register({
  id: 'rooms',
  component: ControlPanel,
  icon: 'mdi-lectern',
  quickComponent: QuickPanel,
  getTitle(t) {
    return t('room.settingsTitle')
  },
  getDescription(t) {
    return t('room.settingsDescription')
  }
})

meetingBubblePlugins.register({
  id: 'meetingRoom',
  component: RealTimeBubble,
  icon: 'mdi-television-play',
  order: 10,
  checkActive(meeting) {
    return userRoomStore().anyRoom((r) => r.meeting === meeting.pk && r.open)
  },
  requireAttention: false
})

router.addRoute({
  component: RealTimeView,
  name: 'room:main',
  path: '/room/:id/:roomId',
  // Outside MeetingRouterView, but it shows meeting content all the same. The
  // agenda item it displays follows the room rather than the route, so that
  // one channel stays with the view.
  meta: { load: [meetingRequirement, roomRequirement] }
})
