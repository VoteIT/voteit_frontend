import { computed, shallowRef, watch } from 'vue'

import router from '@/router'
import { anonymousGate } from '@/modules/auth/loginGate'

import { appReady, bootDone, bootFailed, reportLoadFailure } from './appReady'
import {
  abortNavigation,
  pendingRoute,
  progress,
  settleNavigation,
  startNavigation,
  steps
} from './registry'

// Only what main.ts needs. Requirement factories import from
// './channelRequirement' and './types' directly - going through this module
// would install the guards, and pull the router in, wherever they're used.
export { startAppLoad } from './appReady'

const initialNavigationDone = shallowRef(false)

/**
 * The first navigation failed outright - a requirement threw something nobody
 * had an answer for. `router.isReady()` rejects once and for good when that
 * happens, so nothing will ever set `initialNavigationDone`; without this the
 * splash would sit on "Loading" forever instead of saying what went wrong.
 */
const initialNavigationFailed = shallowRef(false)

/**
 * Everything the app needs before it can show a page: the boot fetches, and the
 * requirements of the route we landed on. Until then the splash stays up - a
 * blocked navigation renders nothing, so there'd be a blank page behind it.
 */
export const appLoaded = computed(
  () => bootDone.value && initialNavigationDone.value
)

/** The app couldn't be brought up at all, by the boot or by its first route. */
export const loadFailed = computed(
  () => bootFailed.value || initialNavigationFailed.value
)

/**
 * Load what the route needs before the navigation is confirmed. Held here
 * rather than in the views, so nothing is mounted until its data is in and a
 * requirement that can't be met can still redirect.
 *
 * `anonymousGate` is consulted first: requirements assume a signed in user, so
 * a visitor without a session loads nothing and is asked to log in.
 */
router.beforeResolve((to, from) =>
  startNavigation(to, from, appReady, anonymousGate)
)

router.afterEach((to, from, failure) => {
  if (failure) abortNavigation(to)
  else settleNavigation(to, from)
})

/**
 * The same settling again, off the route itself.
 *
 * `afterEach` is the natural place for it, but vue-router runs it on the line
 * after `currentRoute` is assigned - and that assignment throws here. The
 * meeting menus are full of `<router-link>`s that leave `:id` to be inherited
 * from the current route, so the moment it becomes one without an `:id`, every
 * one of them raises "Missing required param" from its own computed, and
 * `afterEach` is never reached. That predates the loader; it only became worth
 * noticing once cleanup depended on it.
 *
 * This watcher is triggered by that same assignment but runs through Vue's
 * scheduler, out of reach of the throw. `settleNavigation` is idempotent, so
 * whichever gets there first does the work.
 */
watch(router.currentRoute, (to, from) => settleNavigation(to, from))

router.onError((error, to) => {
  console.error('Navigation failed', error)
  abortNavigation(to)
})

// Resolves once the first navigation has settled, redirects followed. A boot
// that never finishes leaves this pending, and the splash says why.
router.isReady().then(
  () => {
    initialNavigationDone.value = true
  },
  (error) => {
    // A requirement of the first route threw. onError above has logged it, but
    // the splash is covering the app and nothing else will ever lift it: this
    // rejects once, and only for the navigation that got us here.
    initialNavigationFailed.value = true
    reportLoadFailure(error)
  }
)

/**
 * Progress of the navigation currently waiting on its requirements. `total` is
 * 0 when there was nothing to load, which is how the UI knows to stay out of
 * the way.
 */
export default function useNavigationProgress() {
  return {
    appLoaded,
    loadFailed,
    pendingRoute,
    progress,
    steps
  }
}
