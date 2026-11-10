import { beforeEach, expect, test, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'

import { removalRedirect } from './removalGate'

// Importing the gate installs its guard; keep that away from the real router
vi.mock('@/router', () => ({
  default: { beforeEach: vi.fn(), currentRoute: { value: {} } }
}))
vi.mock('@/loader/appReady', () => ({ appReady: new Promise(() => {}) }))

let requested = false
vi.mock('./useAuthStore', () => ({
  default: () => ({
    get hasRequestedRemoval() {
      return requested
    }
  })
}))

function route(name: string, meta: RouteLocationNormalized['meta'] = {}) {
  return { name, meta } as RouteLocationNormalized
}

beforeEach(() => {
  requested = false
})

test('without a removal request, nothing is redirected', () => {
  expect(removalRedirect(route('home', { anonymous: true }))).toBeUndefined()
  expect(removalRedirect(route('profile'))).toBeUndefined()
})

test('with a removal request, every other route leads to the abort page', () => {
  requested = true
  for (const r of [route('home', { anonymous: true }), route('profile')])
    expect(removalRedirect(r)).toEqual({ name: 'auth:abortRemoval' })
})

test('the abort page itself is left alone', () => {
  requested = true
  expect(removalRedirect(route('auth:abortRemoval'))).toBeUndefined()
})
