import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, test, vi } from 'vitest'

import { CustomSocketCode } from '@/socket/Socket'

const { mockOnLoggedOut } = vi.hoisted(() => ({ mockOnLoggedOut: vi.fn() }))

vi.mock('@/socket', () => ({
  socket: { onLoggedOut: mockOnLoggedOut, registerTypeHandler: vi.fn() }
}))
vi.mock('@/utils/restApi', () => ({
  default: { get: vi.fn(), patch: vi.fn() },
  isApiError: () => false
}))

import useAuthStore from './useAuthStore'
import './sessionEnd'

// Registered at import time, the way the module does it in the app
const [loggedOut] = mockOnLoggedOut.mock.calls[0] as [
  (code: CustomSocketCode) => void
]

beforeEach(() => {
  setActivePinia(createPinia())
})

test('the handler is registered once, on import', () => {
  expect(mockOnLoggedOut).toHaveBeenCalledOnce()
})

test('a logged out socket leaves the app anonymous', () => {
  const store = useAuthStore()
  store.user = { pk: 1 } as never
  store.alternateUsers = [{ pk: 2 } as never]

  loggedOut(CustomSocketCode.LoggedOut)

  expect(store.user).toBeNull()
  expect(store.isAnonymous).toBe(true)
  expect(store.alternateUsers).toEqual([])
})

test('the handler holds no store of its own, so a later one is cleared too', () => {
  // It outlives any single pinia: it must reach for the store when it fires,
  // not close over the one that happened to exist at registration.
  useAuthStore().user = { pk: 1 } as never
  setActivePinia(createPinia())
  const store = useAuthStore()
  store.user = { pk: 3 } as never

  loggedOut(CustomSocketCode.LoggedOut)

  expect(store.user).toBeNull()
})
