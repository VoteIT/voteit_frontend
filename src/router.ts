import { createRouter, createWebHistory } from 'vue-router'

import PageNotFoundView from '@/views/PageNotFoundView.vue'
import appBar from '@/components/AppBar.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // All routes inserted from modules, otherwise show a 404 message
    {
      path: '/:pathMatch(.*)*',
      name: '404',
      components: {
        default: PageNotFoundView,
        appBar
      },
      // A wrong address is a wrong address whether or not anyone is signed in
      meta: { anonymous: true }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})
