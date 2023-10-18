import { computed } from 'vue'

import router from '@/router'
import { meetingBubblePlugins } from '../meetings/registry'

import AppBar from './AppBar.vue'
import RealTimeBubble from './RealTimeBubble.vue'
import RealTimeView from './RealTimeView.vue'

meetingBubblePlugins.register({
  id: 'presence_check',
  component: RealTimeBubble,
  icon: 'mdi-motion-play',
  order: 10,
  checkActive() {
    return true
  },
  requireAttention: computed(() => false)
})

router.addRoute({
  components: {
    appBar: AppBar,
    default: RealTimeView
  },
  name: 'realTime:main',
  path: '/real-time/:id'
})
