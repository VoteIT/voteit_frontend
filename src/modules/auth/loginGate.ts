import type { RouteLocationNormalized } from 'vue-router'

import { openDialogEvent } from '@/utils/events'
import { t } from '@/utils/locales'
import { ThemeColor } from '@/utils/types'
import useOrgStore from '@/modules/organisations/useOrgStore'

import useAuthStore from './useAuthStore'

interface PromptLoginOptions {
  /** What to say instead of the general "you need to log in" */
  message?: string
  /** Where to come back to afterwards. Defaults to the page we're on. */
  next?: string
  /** Run when the user would rather not log in after all */
  cancel?: () => void
}

/**
 * Ask the user to log in, and send them off to do it if they say yes.
 *
 * An organisation that isn't taking logins has nowhere to send them, so they
 * get the same explanation with nothing but an acknowledgement - which is what
 * `canLogin` means everywhere else it's honoured.
 */
export function promptLogin({
  message,
  next,
  cancel
}: PromptLoginOptions = {}) {
  const { canLogin, getLoginURL } = useOrgStore()
  const url = getLoginURL(next)
  const possible = canLogin && !!url
  openDialogEvent.emit({
    title: message ?? t('permission.defaultLoginMessage'),
    resolve: (yes) => {
      if (possible && yes) return location.assign(url as string)
      cancel?.()
    },
    dismissible: false,
    no: possible ? t('cancel') : false,
    yes: possible ? t('login') : t('ok'),
    theme: ThemeColor.Primary
  })
}

/**
 * What the loader does about a visitor with no session, consulted once the
 * boot has settled who they are.
 *
 * Requirements are all meeting content the server only hands to a signed in
 * user, over a socket that is never opened for anyone else - so none of them
 * are worth running, and a route that has nothing else to show asks for a
 * login instead of mounting a view that can't fill itself. Which routes those
 * are is the routes' own business: see `RouteMeta.anonymous`.
 */
export function anonymousGate(to: RouteLocationNormalized) {
  if (useAuthStore().isAuthenticated) return
  if (to.meta.anonymous) return false
  // Named here rather than read from the browser: we haven't gone there, and
  // are about to send them home instead.
  promptLogin({ next: to.fullPath })
  return { name: 'home' }
}
