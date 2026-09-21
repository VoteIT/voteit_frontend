import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { TypeHandler } from '@/socket/types'

const { mockRequest, mockRegister } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
  mockRegister: vi.fn()
}))

vi.mock('@/socket', () => ({
  socket: { registerTypeHandler: mockRegister }
}))
vi.mock('@/utils/restApi', () => ({
  default: { request: mockRequest },
  isApiError: () => false
}))

import useAuthStore from './useAuthStore'
import { selfInvalidatedEvent } from './selfInvalidation'

// useUserDetails registers for 'user' too, and is imported before us
const [type, handler] = mockRegister.mock.calls.at(-1) as [string, TypeHandler]

beforeEach(() => {
  setActivePinia(createPinia())
  mockRequest.mockReset().mockResolvedValue([])
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

test('registers for user messages on import', () => {
  expect(type).toBe('user')
})

test('refetches the signed-in user when they are invalidated', () => {
  const store = useAuthStore()
  store.user = { pk: 1 } as never
  const listener = vi.fn()
  const sub = selfInvalidatedEvent.on(listener)

  handler({ action: 'inv', payload: { pk: 1 } })
  expect(listener).not.toHaveBeenCalled()
  vi.advanceTimersByTime(100)
  sub.dispose()

  expect(listener).toHaveBeenCalledOnce()
  expect(mockRequest).toHaveBeenCalledWith(
    expect.objectContaining({ method: 'get', url: 'user/' })
  )
})

test('ignores other users, other actions and anonymous sessions', () => {
  const store = useAuthStore()
  const listener = vi.fn()
  const sub = selfInvalidatedEvent.on(listener)

  store.user = null
  handler({ action: 'inv', payload: { pk: 1 } })
  store.user = { pk: 1 } as never
  handler({ action: 'inv', payload: { pk: 2 } })
  handler({ action: 'changed', payload: { pk: 1 } })
  vi.runAllTimers()
  sub.dispose()

  expect(mockRequest).not.toHaveBeenCalled()
  expect(listener).not.toHaveBeenCalled()
})

test('duplicate invalidations close together refresh once', () => {
  const store = useAuthStore()
  store.user = { pk: 1 } as never
  const listener = vi.fn()
  const sub = selfInvalidatedEvent.on(listener)

  handler({ action: 'inv', payload: { pk: 1 } })
  vi.advanceTimersByTime(60)
  handler({ action: 'inv', payload: { pk: 1 } })
  vi.advanceTimersByTime(60)
  expect(listener).not.toHaveBeenCalled()
  vi.advanceTimersByTime(40)
  sub.dispose()

  expect(listener).toHaveBeenCalledOnce()
  expect(mockRequest).toHaveBeenCalledOnce()
})

test('nothing is refreshed if the user signs out while waiting', () => {
  const store = useAuthStore()
  store.user = { pk: 1 } as never
  const listener = vi.fn()
  const sub = selfInvalidatedEvent.on(listener)

  handler({ action: 'inv', payload: { pk: 1 } })
  store.user = null
  vi.runAllTimers()
  sub.dispose()

  expect(listener).not.toHaveBeenCalled()
  expect(mockRequest).not.toHaveBeenCalled()
})
