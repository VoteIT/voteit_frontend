import { beforeEach, expect, test, vi } from 'vitest'

vi.mock('@/utils/restApi', () => ({
  default: { get: vi.fn(), post: vi.fn() },
  isApiError: () => false
}))

const providers = [
  {
    provider_id: 'idproxy',
    title: 'VoteIT ID',
    login_url: 'https://id.example.com/login-to/testserver',
    profile_url: 'https://id.example.com/',
    logout_url: 'https://id.example.com/log-out',
    scope: ['email']
  },
  {
    provider_id: 'scoutid',
    title: 'ScoutID',
    login_url: '/login/scoutid/',
    profile_url: 'https://scoutid.example/account',
    logout_url: 'https://scoutid.example/logout',
    scope: ['openid']
  }
]
vi.mock('@/modules/organisations/useOrgStore', () => ({
  default: () => ({ providers })
}))

let loginProvider: string | null = null
vi.mock('./useAuthStore', () => ({
  default: () => ({
    get user() {
      return { pk: 1, login_provider: loginProvider }
    }
  })
}))

import restApi from '@/utils/restApi'

import useLoginMethods, { clearLoginMethods } from './useLoginMethods'

const assign = vi.fn()
vi.stubGlobal('location', { assign })

const get = vi.mocked(restApi.get)
const post = vi.mocked(restApi.post)

function connection(provider: string, only = false) {
  return {
    pk: 1,
    provider,
    title: provider,
    created: '2026-01-01T00:00:00Z',
    modified: '2026-01-01T00:00:00Z',
    is_only_login_method: only
  }
}

beforeEach(() => {
  clearLoginMethods()
  loginProvider = null
  get.mockReset()
  post.mockReset()
  assign.mockClear()
})

test('connections are fetched once and shared', async () => {
  get.mockResolvedValue([connection('idproxy', true)])
  const { connections, fetchConnections } = useLoginMethods()

  await fetchConnections()
  await useLoginMethods().fetchConnections()

  expect(get).toHaveBeenCalledTimes(1)
  expect(connections.value).toHaveLength(1)
})

test('the session provider is the one the server says opened it', () => {
  loginProvider = 'scoutid'
  const { logoutURL, manageAccountURL, sessionProvider } = useLoginMethods()

  expect(sessionProvider.value?.provider_id).toBe('scoutid')
  expect(manageAccountURL.value).toBe('https://scoutid.example/account')
  expect(logoutURL.value).toBe('https://scoutid.example/logout')
})

test('a session from no provider of ours names none', () => {
  const { logoutURL, manageAccountURL, sessionProvider } = useLoginMethods()

  // Guessing would log someone out of a service they are still using
  expect(sessionProvider.value).toBeUndefined()
  expect(manageAccountURL.value).toBeUndefined()
  expect(logoutURL.value).toBeUndefined()
})

test('a provider the organisation no longer offers names none', () => {
  loginProvider = 'gone-away'
  const { sessionProvider } = useLoginMethods()

  expect(sessionProvider.value).toBeUndefined()
})

test('only the providers that are not attached yet can be connected', async () => {
  get.mockResolvedValue([connection('idproxy')])
  const { connectableProviders, fetchConnections } = useLoginMethods()

  await fetchConnections()

  expect(connectableProviders.value.map((p) => p.provider_id)).toEqual([
    'scoutid'
  ])
})

test('connecting records the intent before leaving', async () => {
  post.mockResolvedValue({ provider: 'scoutid', login_url: '/login/scoutid/' })
  const { connect } = useLoginMethods()

  await connect(providers[1])

  expect(post).toHaveBeenCalledWith('user/connect/', { provider: 'scoutid' })
  expect(assign).toHaveBeenCalledWith('/login/scoutid/')
})

test('disconnecting re-reads what is left', async () => {
  get.mockResolvedValue([connection('idproxy')])
  post.mockResolvedValue(undefined)
  const { connections, disconnect } = useLoginMethods()

  await disconnect(connection('scoutid'))

  expect(post).toHaveBeenCalledWith('user/disconnect/', {
    provider: 'scoutid'
  })
  // Re-read, rather than trusting what we think is left
  expect(get).toHaveBeenCalledWith('user/connections/')
  expect(connections.value).toEqual([connection('idproxy')])
})
