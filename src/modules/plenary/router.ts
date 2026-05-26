import router from '@/router'
import Plenary from './Plenary.vue'

router.addRoute({
  path: '/cast/:id/:roomId/:aid/:tab?',
  name: 'room:broadcast',
  component: Plenary,
  beforeEnter(to) {
    if (!to.params.tab) {
      return {
        ...to,
        params: {
          ...to.params,
          tab: localStorage.getItem('plenary:viewMode') ?? 'decisions'
        }
      }
    }
  }
})
