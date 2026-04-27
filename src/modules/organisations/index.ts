import router from '@/router'
import HomeView from './HomeView.vue'

router.addRoute({
  component: HomeView,
  name: 'home',
  path: '/'
})
