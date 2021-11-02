import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/views/Home.vue'
import meeting from '@/modules/meetings/router'
import JoinMeeting from '@/modules/meetings/JoinView.vue'
import plenary from '@/modules/plenary/router'
import speakerFullscreen from '@/modules/speakerLists/fullscreenRouter'
import AppBar from '@/components/AppBar.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    components: {
      default: Home,
      appBar: AppBar
    }
  },
  meeting,
  plenary,
  speakerFullscreen,
  // Join has url outside meeting, so users don't need meeting roles to visit this view.
  {
    path: '/join/:id/:slug',
    name: 'JoinMeeting',
    components: {
      default: JoinMeeting,
      appBar: AppBar
    }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
