import router from '@/router'
import AbortRemovalView from './AbortRemovalView.vue'
import AcceptTosView from './AcceptTosView.vue'
import ErrorView from './ErrorView.vue'
import LinkAccountView from './LinkAccountView.vue'
import './removalGate'
import './selfInvalidation'
import './sessionEnd'

router.addRoute({
  path: '/error',
  name: 'auth:error',
  component: ErrorView,
  // Where the backend lands a login that didn't work, so it has to be
  // reachable without one
  meta: { anonymous: true }
})

router.addRoute({
  path: '/link-account',
  name: 'auth:linkAccount',
  component: LinkAccountView,
  // The login that sent them here is paused half way through, so there is no
  // session yet - the partial token in the query is what stands in for one
  meta: { anonymous: true }
})

router.addRoute({
  path: '/accept-tos',
  name: 'auth:acceptTos',
  component: AcceptTosView,
  // Like link-account, the login is paused before there's a session
  meta: { anonymous: true }
})

router.addRoute({
  path: '/abort-removal',
  name: 'auth:abortRemoval',
  component: AbortRemovalView,
  // Linked from the removal email, and where a login to an account marked for
  // removal is sent - neither comes with a session
  meta: { anonymous: true }
})
