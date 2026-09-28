import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, expect, test, vi } from 'vitest'

import vuetify from '@/plugins/vuetify'
import UserMenu from './UserMenu.vue'

const providers = [
  {
    provider_id: 'idproxy',
    title: 'VoteIT ID',
    login_url: 'https://id.example.com/login-to/testserver',
    profile_url: 'https://id.example.com/',
    logout_url: 'https://id.example.com/log-out',
    scope: ['email']
  }
]
vi.mock('@/modules/organisations/useOrgStore', () => ({
  default: () => ({ providers })
}))

// The child components drag in the meeting content types; the menu itself
// needs none of them.
vi.mock('./UserAvatar.vue', () => ({ default: { template: '<div />' } }))
vi.mock('./DefaultDialog.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/modules/organisations/SwitchProfileDialog.vue', () => ({
  default: { template: '<div />' }
}))

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }))
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return { ...actual, useRouter: vi.fn(() => ({ push: mockPush })) }
})

// The logout drops the user, which is what `logoutURL` is derived from.
let user: { pk: number; login_provider: string | null } | null = null
const logout = vi.fn(async () => {
  user = null
})
vi.mock('@/modules/auth/useAuthStore', () => ({
  default: () => ({
    get user() {
      return user
    },
    logout
  })
}))

const assign = vi.fn()
vi.stubGlobal('location', { assign })

beforeEach(() => {
  vi.clearAllMocks()
  user = { pk: 1, login_provider: 'idproxy' }
})

function logoutFrom(wrapper: ReturnType<typeof mount>) {
  return (wrapper.vm as unknown as { logout: () => Promise<void> }).logout()
}

function mountMenu() {
  return mount(UserMenu, { global: { plugins: [vuetify] }, shallow: true })
}

test('logout ends the provider session too', async () => {
  const wrapper = mountMenu()
  await logoutFrom(wrapper)
  await flushPromises()
  expect(logout).toHaveBeenCalled()
  expect(assign).toHaveBeenCalledWith('https://id.example.com/log-out')
  expect(mockPush).not.toHaveBeenCalled()
})

test('logout goes home when no provider opened the session', async () => {
  user = { pk: 1, login_provider: null }
  const wrapper = mountMenu()
  await logoutFrom(wrapper)
  await flushPromises()
  expect(assign).not.toHaveBeenCalled()
  expect(mockPush).toHaveBeenCalledWith({ name: 'home' })
})
