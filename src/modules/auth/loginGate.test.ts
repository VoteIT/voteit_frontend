import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'

import { openDialogEvent } from '@/utils/events'

import { anonymousGate, promptLogin } from './loginGate'

vi.mock('@/utils/locales', () => ({ t: (key: string) => key }))

let isAuthenticated = false
vi.mock('./useAuthStore', () => ({
  default: () => ({
    get isAuthenticated() {
      return isAuthenticated
    }
  })
}))

let canLogin = true
vi.mock('@/modules/organisations/useOrgStore', () => ({
  default: () => ({
    get canLogin() {
      return canLogin
    },
    getLoginURL: (next = '/here') => `https://id.example.com/?next=${next}`
  })
}))

const assign = vi.fn()
vi.stubGlobal('location', { assign, pathname: '/here' })

const dialog = vi.fn()
let dispose: () => void

/** The route we're heading for, with `meta` as the records left it */
function route(meta: RouteLocationNormalized['meta'] = {}) {
  return { fullPath: '/m/1/a-meeting', meta } as RouteLocationNormalized
}

beforeEach(() => {
  isAuthenticated = false
  canLogin = true
  dispose = openDialogEvent.on(dialog).dispose
})

afterEach(() => {
  dispose()
  dialog.mockClear()
  assign.mockClear()
})

test('a signed in user is left alone', () => {
  isAuthenticated = true
  expect(anonymousGate(route())).toBeUndefined()
  expect(dialog).not.toHaveBeenCalled()
})

test('a route that works signed out loads nothing and says nothing', () => {
  expect(anonymousGate(route({ anonymous: true }))).toBe(false)
  expect(dialog).not.toHaveBeenCalled()
})

test('anywhere else asks for a login and sends them home', () => {
  expect(anonymousGate(route())).toEqual({ name: 'home' })
  expect(dialog).toHaveBeenCalledWith(
    expect.objectContaining({
      title: 'permission.defaultLoginMessage',
      yes: 'login',
      no: 'cancel'
    })
  )

  // Back here afterwards, and not to the page they're being sent to meanwhile
  dialog.mock.calls[0][0].resolve(true)
  expect(assign).toHaveBeenCalledWith(
    'https://id.example.com/?next=/m/1/a-meeting'
  )
})

test('declining runs the caller cancel', () => {
  const cancel = vi.fn()
  promptLogin({ cancel })
  dialog.mock.calls[0][0].resolve(false)
  expect(assign).not.toHaveBeenCalled()
  expect(cancel).toHaveBeenCalled()
})

test('an organisation that takes no logins only explains', () => {
  canLogin = false
  promptLogin()
  expect(dialog).toHaveBeenCalledWith(
    expect.objectContaining({ yes: 'ok', no: false })
  )

  // Nowhere to send them, so acknowledging is all it does
  dialog.mock.calls[0][0].resolve(true)
  expect(assign).not.toHaveBeenCalled()
})
