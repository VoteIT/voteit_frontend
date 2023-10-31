import { createRouter, createWebHistory } from 'vue-router'

import PageNotFoundView from '@/views/PageNotFoundView.vue'
import appBar from '@/components/AppBar.vue'

// import speakerFullscreen from '@/modules/speakerLists/fullscreenRouter'
import plenary from '@/modules/plenary/router'
import meeting from '@/modules/meetings/router'

import Home from '@/modules/organisations/Home.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  ...meeting,
  plenary,
  // speakerFullscreen,
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
  history: createWebHistory(import.meta.env.BASE_URL),
  // @ts-ignore - vue-tsc stops on this
  routes
})

export default router
