import router from '@/router'
import ErrorView from './ErrorView.vue'

router.addRoute({
  path: '/error',
  name: 'auth:error',
  component: ErrorView
})
