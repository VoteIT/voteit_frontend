import router from '@/router'
import HomeView from './HomeView.vue'
import ProfileView from './ProfileView.vue'

router.addRoute({
  component: HomeView,
  name: 'home',
  path: '/'
})

router.addRoute({
  component: ProfileView,
  name: 'profile',
  path: '/profile'
})
