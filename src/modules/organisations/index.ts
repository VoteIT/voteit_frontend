import router from '@/router'

import { meetingListRequirement } from '../meetings/listRequirement'
import AboutView from './AboutView.vue'
import HomeView from './HomeView.vue'
import ProfileView from './ProfileView.vue'

router.addRoute({
  component: HomeView,
  name: 'home',
  path: '/',
  meta: { load: meetingListRequirement }
})

router.addRoute({
  component: ProfileView,
  name: 'profile',
  path: '/profile'
})

router.addRoute({
  component: AboutView,
  name: 'about',
  path: '/about'
})
