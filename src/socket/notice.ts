import { dialogQuery } from '@/utils'
import { t } from '@/utils/locales'
import { ThemeColor } from '@/utils/types'

import type { Notice, NoticeType } from './types'

const NOTICE_THEMES: Record<NoticeType, ThemeColor> = {
  info: ThemeColor.Info,
  warning: ThemeColor.Warning,
  error: ThemeColor.Error
}

const NOTICE_ICONS: Record<NoticeType, string> = {
  info: 'mdi-information',
  warning: 'mdi-alert',
  error: 'mdi-alert-decagram'
}

/**
 * Show a server notice in a dialog the user can only acknowledge. Resolves when dismissed.
 */
export async function showNotice({ type = 'info', message }: Notice) {
  // Unknown types from a newer backend still get shown, as info
  if (!(type in NOTICE_THEMES)) type = 'info'
  await dialogQuery({
    title: message,
    theme: NOTICE_THEMES[type],
    icon: NOTICE_ICONS[type],
    no: false,
    yes: t('close')
  })
}
