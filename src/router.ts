import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

import PageNotFoundView from '@/views/PageNotFoundView.vue'
import appBar from '@/components/AppBar.vue'

import plenary from '@/modules/plenary/router'
import meeting from '@/modules/meetings/router'

import Home from '@/modules/organisations/Home.vue'

const routes: RouteRecordRaw[] = [
  {
    component: Home,
    name: 'home',
    path: '/'
  },
  ...meeting,
  plenary,
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

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})
