import { beforeEach, expect, test, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'

import { anonymousGate, needsLogin } from './loginGate'

/** `undefined` until the boot has settled who they are, then a user or null */
let user: object | null | undefined
vi.mock('./useAuthStore', () => ({
  default: () => ({
    get isAnonymous() {
      return user === null
    },
    get isAuthenticated() {
      return !!user
    }
  })
}))

/** The route we're heading for, with `meta` as the records left it */
function route(meta: RouteLocationNormalized['meta'] = {}) {
  return { fullPath: '/m/1/a-meeting', meta } as RouteLocationNormalized
}

beforeEach(() => {
  user = null
})

test('a signed in user is left alone', () => {
  user = { pk: 1 }
  expect(anonymousGate()).toBeUndefined()
  expect(needsLogin(route())).toBe(false)
})

test('a visitor loads nothing, and stays where they were heading', () => {
  expect(anonymousGate()).toBe(false)
})

test('a visitor is shown the login only where a session is needed', () => {
  expect(needsLogin(route())).toBe(true)
  expect(needsLogin(route({ anonymous: true }))).toBe(false)
})

test('nobody is asked to log in before the boot knows who they are', () => {
  user = undefined
  expect(needsLogin(route())).toBe(false)
})
