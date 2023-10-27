import { any } from 'itertools'
import { computed } from 'vue'

import router from '@/router'
import { meetingBubblePlugins } from '../meetings/registry'

import RealTimeBubble from './RealTimeBubble.vue'
import RealTimeView from './RealTimeView.vue'

// VoteIT module dependencies
import '../rooms'
import { meetingRoomStore } from '../rooms/useRooms'

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
  name: 'realTime:main',
  path: '/real-time/:id/:roomId'
})
