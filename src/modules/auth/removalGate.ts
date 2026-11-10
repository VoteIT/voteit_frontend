import { watch } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

import router from '@/router'
import { appReady } from '@/loader/appReady'

import useAuthStore from './useAuthStore'

export const ABORT_REMOVAL_ROUTE = 'auth:abortRemoval'

/**
 * A user who asked to have their account removed can't use the app while the
 * request stands. Every route but the abort page leads there, where they can
 * see what happens next, or withdraw the request.
 */
export function removalRedirect(to: RouteLocationNormalized) {
  if (!useAuthStore().hasRequestedRemoval) return
  if (to.name === ABORT_REMOVAL_ROUTE) return
  return { name: ABORT_REMOVAL_ROUTE }
}

/**
 * Wait for the boot: until then the user is unknown, and the first navigation
 * would slip through. The loader holds that navigation for the boot anyway.
 */
router.beforeEach(async (to) => {
  await appReady
  return removalRedirect(to)
})

// The request may be made, or learned of, while on another route - in another
// tab, say, and picked up when the user is refetched. Started after the boot,
// when pinia is sure to be active.
appReady.then(() =>
  watch(
    () => useAuthStore().hasRequestedRemoval,
    (requested) => {
      if (requested && router.currentRoute.value.name !== ABORT_REMOVAL_ROUTE)
        router.replace({ name: ABORT_REMOVAL_ROUTE })
    }
  )
)
