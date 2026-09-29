import router from '@/router'

import { meetingListRequirement } from '../meetings/listRequirement'
import AboutView from './AboutView.vue'
import HomeView from './HomeView.vue'
import OrgControlPanelView from './OrgControlPanelView.vue'
import ProfileView from './ProfileView.vue'
import { tosPanelRequirement } from './useTermsOfService'

router.addRoute({
  component: HomeView,
  name: 'home',
  path: '/',
  // Signed out this is the front page, with the login button on it - and the
  // meeting list is simply not loaded
  meta: { anonymous: true, load: meetingListRequirement }
})

router.addRoute({
  component: ProfileView,
  name: 'profile',
  path: '/profile'
})

router.addRoute({
  component: AboutView,
  name: 'about',
  path: '/about',
  meta: { anonymous: true }
})

router.addRoute({
  component: OrgControlPanelView,
  name: 'orgControlPanel',
  path: '/control-panel/:panel?',
  meta: { load: tosPanelRequirement }
})
