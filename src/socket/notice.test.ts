import { expect, test } from 'vitest'

import { openDialogEvent } from '@/utils/events'

import { showNotice } from './notice'
import type { Notice } from './types'

test.each([
  [{ message: 'Hi' }, 'info', 'mdi-information'],
  [{ type: 'warning', message: 'Hi' }, 'warning', 'mdi-alert'],
  [{ type: 'error', message: 'Hi' }, 'error', 'mdi-alert-decagram'],
  [{ type: 'unknown', message: 'Hi' }, 'info', 'mdi-information']
])('showNotice %o', async (notice, theme, icon) => {
  const listener = openDialogEvent.on((dialog) => {
    expect(dialog).toMatchObject({
      title: 'Hi',
      no: false,
      yes: 'Close',
      theme,
      icon
    })
    dialog.resolve(true)
  })
  await expect(showNotice(notice as Notice)).resolves.toBeUndefined()
  listener.dispose()
})
