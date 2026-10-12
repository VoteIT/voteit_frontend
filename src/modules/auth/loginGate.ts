import type { RouteLocationNormalized } from 'vue-router'

import useAuthStore from './useAuthStore'

/**
 * A visitor with no session is on a route that needs one, so the app shows
 * `LoginRequiredView` in its place - at the address they asked for, so that
 * logging in brings them straight back to it.
 *
 * Only once the boot has settled who they are: until then the user is
 * unknown rather than absent, and the splash is covering whatever is here.
 */
export function needsLogin(route: RouteLocationNormalized) {
  return useAuthStore().isAnonymous && !route.meta.anonymous
}

/**
 * What the loader does about a visitor with no session, consulted once the
 * boot has settled who they are.
 *
 * Requirements are all meeting content the server only hands to a signed in
 * user, over a socket that is never opened for anyone else - so none of them
 * are worth running. The navigation still goes through, and stays on the
 * address it was heading for: see `needsLogin` for what's shown there instead
 * of the view, and `RouteMeta.anonymous` for the routes that need no session.
 */
export function anonymousGate() {
  if (useAuthStore().isAuthenticated) return
  return false
}
