import { createRouter, createWebHistory } from 'vue-router'

import PageNotFoundView from '@/views/PageNotFoundView.vue'
import appBar from '@/components/AppBar.vue'

import speakerFullscreen from '@/modules/speakerLists/fullscreenRouter'
import plenary from '@/modules/plenary/router'
import meeting from '@/modules/meetings/router'

import JoinMeeting from '@/modules/meetings/JoinView.vue'
import Home from '@/modules/organisations/Home.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    components: {
      default: Home,
      appBar
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
      appBar
    }
  },
  // Other pages, do a 404
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    components: {
      default: PageNotFoundView,
      appBar
    }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
