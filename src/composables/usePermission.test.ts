import { openDialogEvent } from '@/utils/events'
import { afterEach, expect, test, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import usePermission, { PermissionDeniedStrategy } from './usePermission'

vi.mock(
  'vue-i18n',
  vi.fn(() => ({ useI18n: () => ({ t: (str: string) => str }) }))
)

const mockRouter = { push: vi.fn() }
vi.mock(
  'vue-router',
  vi.fn(() => ({ useRouter: () => mockRouter }))
)

// Mutable so individual tests can control isAuthenticated
let mockIsAuthenticated = false
vi.mock(
  '@/modules/auth/useAuthStore',
  vi.fn(() => ({ default: () => ({ isAuthenticated: mockIsAuthenticated }) }))
)
vi.mock(
  '@/modules/organisations/useOrgStore',
  vi.fn(() => ({ default: () => ({ loginURL: 'https://login.example.com' }) }))
)

afterEach(() => {
  mockIsAuthenticated = false
  mockRouter.push.mockClear()
})

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

test('usePermission default - uses custom message as title', () => {
  const fn = vi.fn()
  const { dispose } = openDialogEvent.on(fn)

  usePermission(ref(false), { message: 'Custom error message' })

  expect(fn).toHaveBeenLastCalledWith(
    expect.objectContaining({ title: 'Custom error message' })
  )
  dispose()
})

test('usePermission custom - changed is true when going from true to false', async () => {
  const handler = vi.fn()
  const permission = ref(true)
  usePermission(permission, {}, handler)

  permission.value = false
  await nextTick()

  expect(handler).toHaveBeenLastCalledWith(
    expect.any(Object), // options
    expect.any(Object), // router
    expect.any(Function), // t
    true // changed
  )
})

test('usePermission default - shows changed message when permission is revoked', async () => {
  const fn = vi.fn()
  const { dispose } = openDialogEvent.on(fn)

  const permission = ref(true)
  usePermission(permission)
  permission.value = false
  await nextTick()

  expect(fn).toHaveBeenLastCalledWith(
    expect.objectContaining({ title: 'permission.defaultChangedMessage' })
  )
  dispose()
})

test('usePermission requireLogin - shows login dialog when not authenticated', () => {
  mockIsAuthenticated = false
  const fn = vi.fn()
  const { dispose } = openDialogEvent.on(fn)

  usePermission(ref(false), {}, PermissionDeniedStrategy.RequireLogin)

  expect(fn).toHaveBeenLastCalledWith(
    expect.objectContaining({
      title: 'permission.defaultLoginMessage',
      yes: 'login',
      no: 'cancel',
      theme: 'primary'
    })
  )
  dispose()
})

test('usePermission requireLogin - falls back to default strategy when authenticated', () => {
  mockIsAuthenticated = true
  const fn = vi.fn()
  const { dispose } = openDialogEvent.on(fn)

  usePermission(ref(false), {}, PermissionDeniedStrategy.RequireLogin)

  expect(fn).toHaveBeenLastCalledWith(
    expect.objectContaining({
      theme: 'error',
      yes: 'ok'
    })
  )
  dispose()
})
