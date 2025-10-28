import { MaybeRef, ref, Ref, unref, watch } from 'vue'
import { ComposerTranslation, useI18n } from 'vue-i18n'
import { RouteLocationRaw, Router, useRouter } from 'vue-router'

import { openDialogEvent } from '@/utils/events'
import { ThemeColor } from '@/utils/types'
import useAuthStore from '@/modules/auth/useAuthStore'
import useOrganisation from '@/modules/organisations/useOrganisation'

interface PermissionOptions {
  message?: string
  to: MaybeRef<RouteLocationRaw>
}
export enum PermissionDeniedStrategy {
  Default = 'default',
  RequireLogin = 'requireLogin'
}
type PermissonValue = boolean | undefined
type PermissionDeniedHandler = (
  options: PermissionOptions,
  router: Router,
  t: ComposerTranslation,
  changed: boolean
) => void

const DEFAULT_OPTIONS: PermissionOptions = {
  to: { name: 'home' }
}

const { loginURL } = useOrganisation()

const strategies: Record<PermissionDeniedStrategy, PermissionDeniedHandler> = {
  default({ message, to }, router, t, changed) {
    const title =
      message ?? changed
        ? t('permission.defaultChangedMessage')
        : t('permission.defaultMessage')
    openDialogEvent.emit({
      title,
      resolve: () => router.push(unref(to)),
      dismissible: false,
      no: false,
      yes: t('ok'),
      theme: ThemeColor.Error
    })
  },
  requireLogin(options, router, t, changed) {
    if (useAuthStore().isAuthenticated)
      return strategies.default(options, router, t, changed)
    openDialogEvent.emit({
      title: options.message ?? t('permission.defaultLoginMessage'),
      resolve: (doLogin) => {
        if (doLogin) location.assign(loginURL.value!)
        else router.push({ name: 'home' })
      },
      dismissible: false,
      no: t('cancel'),
      yes: t('login'),
      theme: ThemeColor.Primary
    })
  }
}

export default function usePermission(
  permission: Ref<PermissonValue>,
  options: Partial<PermissionOptions> = {},
  strategy:
    | PermissionDeniedStrategy
    | PermissionDeniedHandler = PermissionDeniedStrategy.Default
) {
  const router = useRouter()
  const { t } = useI18n()

  const previousValue = ref<PermissonValue>(permission.value)

  function denyUser() {
    const method =
      typeof strategy === 'function' ? strategy : strategies[strategy]
    method(
      { ...DEFAULT_OPTIONS, ...options },
      router,
      t,
      previousValue.value === true
    )
  }

  watch(
    permission,
    (allowed) => {
      if (allowed === false) denyUser()
      previousValue.value = allowed
    },
    { immediate: true }
  )
}
