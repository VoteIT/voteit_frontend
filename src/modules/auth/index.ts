import router from '@/router'
import ErrorView from './ErrorView.vue'
import './sessionEnd'

router.addRoute({
  path: '/error',
  name: 'auth:error',
  component: ErrorView,
  // Where the backend lands a login that didn't work, so it has to be
  // reachable without one
  meta: { anonymous: true }
})
