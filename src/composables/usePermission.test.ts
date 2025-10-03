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
  // Immediately false
  usePermission(ref(false), {}, handler)
  expect(handler).toHaveBeenCalledOnce()

  // Undefined, then false
  const undefToFalse = ref<boolean>()
  usePermission(undefToFalse, {}, handler)
  expect(handler).toHaveBeenCalledOnce()
  undefToFalse.value = false
  await nextTick() // Won't be called until next tick
  expect(handler).toHaveBeenCalledTimes(2)

  // True, then false
  const permission = ref(true)
  usePermission(permission, {}, handler)
  expect(handler).toHaveBeenCalledTimes(2)
  permission.value = false
  await nextTick() // Won't be called until next tick
  expect(handler).toHaveBeenCalledTimes(3)
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
