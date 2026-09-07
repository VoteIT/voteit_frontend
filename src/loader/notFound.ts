import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'

import type { Requirement } from './types'

/**
 * The 404 view, at the address the user actually typed.
 *
 * Named rather than pushed by path: the path is one a real route matches, which
 * is how we got here. Naming the record picks the 404 view regardless, and
 * `pathMatch` - the repeated param of `/:pathMatch(.*)*` in `src/router.ts` -
 * puts the address back in the bar, so a reload or a copied link says the same
 * thing.
 */
export function notFoundRoute(to: RouteLocationNormalized): RouteLocationRaw {
  return {
    name: '404',
    params: { pathMatch: to.path.slice(1).split('/') },
    query: to.query,
    hash: to.hash
  }
}

/**
 * What a requirement factory returns when the route's own params are wrong - an
 * id that isn't one, typically.
 *
 * Returning nothing instead is the loader's way of saying "this route has
 * nothing to load", and the view is left to mount with no data and nothing to
 * say about it. Blocking because a redirect is the one answer that can't be
 * given once the view is mounted; it holds nothing, so there is no `release`.
 */
export function notFoundRequirement(to: RouteLocationNormalized): Requirement {
  return {
    key: 'not-found',
    blocking: true,
    async load() {
      return notFoundRoute(to)
    }
  }
}
