import { openDialogEvent } from '@/utils/events'
import { expect, test, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import usePermission from './usePermission'

vi.mock(
  'vue-i18n',
  vi.fn(() => ({ useI18n: () => ({ t: (str: string) => str }) }))
)

test('usePermission custom', async () => {
  expect(usePermission).toBeTruthy()

  const handler = vi.fn()
  usePermission(ref(false), {}, handler)
  expect(handler).toHaveBeenCalledOnce()

  const permission = ref(true)
  usePermission(permission, {}, handler)
  expect(handler).toHaveBeenCalledOnce()

  permission.value = false
  await nextTick() // Won't be called until next tick
  expect(handler).toHaveBeenCalledTimes(2)
})

test('usePermission default', async () => {
  const fn = vi.fn()
  openDialogEvent.on(fn)

  usePermission(ref(false))
  expect(fn).toHaveBeenCalledOnce()
  expect(fn).toHaveBeenLastCalledWith(
    expect.objectContaining({
      dismissible: false,
      theme: 'error',
      title: 'permission.defaultMessage',
      yes: 'ok'
    })
  )
})
