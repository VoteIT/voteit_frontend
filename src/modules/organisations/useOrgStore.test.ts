import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, test, vi } from 'vitest'

const { mockRegisterTypeHandler } = vi.hoisted(() => ({
  mockRegisterTypeHandler: vi.fn()
}))

vi.mock('@/socket', () => ({
  socket: { registerTypeHandler: mockRegisterTypeHandler }
}))
vi.mock('@/utils/restApi', () => ({
  default: { get: vi.fn(), patch: vi.fn() },
  isApiError: (e: unknown) => !!e && typeof e === 'object' && 'status' in e
}))

import restApi from '@/utils/restApi'

import useOrgStore from './useOrgStore'

const ORGANISATION = { pk: 1, title: 'Test org' }

const get = vi.mocked(restApi.get)
const patch = vi.mocked(restApi.patch)

// Other content types are registered by transitive imports, so find ours by name
const socketHandler = mockRegisterTypeHandler.mock.calls.find(
  ([name]) => name === 'organisation'
)![1] as (msg: { action: string; payload: object }) => void

/**
 * What the backend sends on the organisation channel.
 *
 * Only 'changed' - `onChanged` registers its 'added' handler without override,
 * so that one stays bound to the store of the pinia that was active when the
 * store was first used. The app has a single store for the life of the tab, so
 * it only makes a difference to a test giving every case a pinia of its own.
 */
function send(action: 'changed', payload: object) {
  socketHandler({ action, payload })
}

beforeEach(() => {
  setActivePinia(createPinia())
  get.mockReset()
  patch.mockReset()
  get.mockResolvedValue(ORGANISATION)
})

test('the boot fetch puts the organisation in the store', async () => {
  const store = useOrgStore()
  expect(store.organisation).toBeUndefined()

  // What startAppLoad does, before the first route is loaded
  await store.fetchOrganisation()

  expect(store.organisation).toEqual(ORGANISATION)
  expect(store.organisationIsUnavailable).toBe(false)
})

test('a domain with no organisation is marked unavailable', async () => {
  get.mockRejectedValue({ status: 404 })
  const store = useOrgStore()

  await store.fetchOrganisation()

  expect(store.organisationIsUnavailable).toBe(true)
  expect(store.organisation).toBeUndefined()
})

test('a fetch failure other than 404 is left to the caller', async () => {
  get.mockRejectedValue({ status: 500 })
  const store = useOrgStore()

  await expect(store.fetchOrganisation()).rejects.toEqual({ status: 500 })

  // Neither fetched nor known to be unavailable
  expect(store.organisation).toBeUndefined()
  expect(store.organisationIsUnavailable).toBe(false)
})

test('an edit made elsewhere arrives over the socket', async () => {
  const store = useOrgStore()
  await store.fetchOrganisation()

  send('changed', { ...ORGANISATION, title: 'Renamed by someone else' })

  expect(store.organisation).toEqual({
    ...ORGANISATION,
    title: 'Renamed by someone else'
  })
  // The socket carries the change; nothing is re-fetched over REST
  expect(get).toHaveBeenCalledTimes(1)
})

test('an organisation arriving over the socket needs no fetch first', () => {
  const store = useOrgStore()

  send('changed', ORGANISATION)

  expect(store.organisation).toEqual(ORGANISATION)
  expect(get).not.toHaveBeenCalled()
})

test('an edit of our own is stored from the response', async () => {
  patch.mockResolvedValue({ ...ORGANISATION, body: 'New body' })
  const store = useOrgStore()
  await store.fetchOrganisation()

  await store.updateOrganisation({ body: 'New body' })

  expect(patch).toHaveBeenCalledWith('organisation/change/', {
    body: 'New body'
  })
  expect(store.organisation).toEqual({ ...ORGANISATION, body: 'New body' })
})

const IDPROXY = {
  provider_id: 'idproxy',
  title: 'VoteIT ID',
  login_url: 'https://id.example.com/login-to/testserver',
  profile_url: 'https://id.example.com/',
  logout_url: 'https://id.example.com/log-out',
  scope: ['email']
}
const SCOUTID = {
  provider_id: 'scoutid',
  title: 'ScoutID',
  login_url: '/login/scoutid/',
  profile_url: null,
  logout_url: null,
  scope: ['openid', 'email']
}

/** What the boot fetch brings back for an organisation with these providers. */
async function withProviders(...providers: object[]) {
  get.mockResolvedValue({ ...ORGANISATION, active: true, providers })
  const store = useOrgStore()
  await store.fetchOrganisation()
  return store
}

test('providers keep the order the backend sent, primary first', async () => {
  const store = await withProviders(SCOUTID, IDPROXY)

  expect(store.providers.map((p) => p.provider_id)).toEqual([
    'scoutid',
    'idproxy'
  ])
  expect(store.primaryProvider).toEqual(SCOUTID)
})

test('an organisation with no providers offers nothing to click', async () => {
  const store = await withProviders()

  expect(store.primaryProvider).toBeUndefined()
})

test('scopes are the union across the providers', async () => {
  const store = await withProviders(IDPROXY, SCOUTID)

  expect(store.scopes.toSorted()).toEqual(['email', 'openid'])
})

test('the login URL carries where to come back to', async () => {
  const store = await withProviders(IDPROXY)

  expect(store.getLoginURL(store.primaryProvider!, '/m/1/a-meeting')).toBe(
    'https://id.example.com/login-to/testserver?next=%2Fm%2F1%2Fa-meeting'
  )
  // The front page is where they'd land anyway
  expect(store.getLoginURL(store.primaryProvider!, '/')).toBe(
    'https://id.example.com/login-to/testserver'
  )
})

test('starting a login leaves for the provider, coming back to this page', async () => {
  const assign = vi.fn()
  const { location: realLocation } = window
  vi.stubGlobal('location', { assign, pathname: '/here' })
  const store = await withProviders(IDPROXY, SCOUTID)

  store.startLogin(SCOUTID)

  expect(assign).toHaveBeenCalledWith('/login/scoutid/?next=%2Fhere')
  vi.stubGlobal('location', realLocation)
})
