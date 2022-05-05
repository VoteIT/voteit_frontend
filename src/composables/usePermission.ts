import { isRef, ref, Ref, watch } from 'vue'
import { ComposerTranslation, useI18n } from 'vue-i18n'
import { RouteLocationRaw, Router, useRouter } from 'vue-router'

import { openDialogEvent } from '@/utils/events'
import { ThemeColor } from '@/utils/types'

interface PermissionOptions {
  message?: string
  to: RouteLocationRaw | Ref<RouteLocationRaw>
}
export enum PermissionDeniedStrategy {
  Default = 'default'
}
type PermissonValue = boolean | undefined
type PermissionDeniedHandler = (options: PermissionOptions, router: Router, t: ComposerTranslation, changed: boolean) => void

const DEFAULT_OPTIONS: PermissionOptions = {
  to: '/'
}

const strategies: Record<PermissionDeniedStrategy, PermissionDeniedHandler> = {
  default (options, router, t, changed) {
    const { message, to } = options
    const title = message || t(
      changed
        ? 'permission.defaultChangedMessage'
        : 'permission.defaultMessage'
    )
    openDialogEvent.emit({
      title,
      resolve: () => router.push(isRef(to) ? to.value : to),
      dismissible: false,
      no: false,
      yes: t('ok'),
      theme: ThemeColor.Error
    })
  }
}

export default function usePermission (permission: Ref<PermissonValue>, options: Partial<PermissionOptions> = {}, strategy: PermissionDeniedStrategy | PermissionDeniedHandler = PermissionDeniedStrategy.Default) {
  const router = useRouter()
  const { t } = useI18n()

  const previousValue = ref<PermissonValue>(permission.value)

  function denyUser () {
    const method = typeof strategy === 'function'
     ? strategy
     : strategies[strategy]
    method({ ...DEFAULT_OPTIONS, ...options }, router, t, previousValue.value === true)
  }

  watch(permission, allowed => {
    if (allowed === false) denyUser()
    previousValue.value = allowed
  }, { immediate: true })
}
