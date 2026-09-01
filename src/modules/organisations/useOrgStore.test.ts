import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, test, vi } from 'vitest'

vi.mock('@/utils/restApi', () => ({
  default: { get: vi.fn(), patch: vi.fn() },
  isApiError: (e: unknown) => !!e && typeof e === 'object' && 'status' in e
}))

import restApi from '@/utils/restApi'

import useOrgStore from './useOrgStore'

const ORGANISATION = { pk: 1, title: 'Test org' }

const get = vi.mocked(restApi.get)

beforeEach(() => {
  // A store of its own each time, so `fetchedAt` starts clean
  setActivePinia(createPinia())
  vi.useRealTimers()
  get.mockReset()
  get.mockResolvedValue(ORGANISATION)
})

test('refresh does not ask again for what the boot just fetched', async () => {
  const store = useOrgStore()

  // What startAppLoad does, before the first route is loaded
  await store.fetchOrganisation()
  expect(get).toHaveBeenCalledTimes(1)

  // HomeView mounting on the heels of that
  await store.refreshOrganisation()
  expect(get).toHaveBeenCalledTimes(1)
  expect(store.organisation).toEqual(ORGANISATION)
})

test('refresh asks again once what it has is stale', async () => {
  const store = useOrgStore()
  await store.fetchOrganisation()

  vi.useFakeTimers()
  vi.advanceTimersByTime(31_000)
  await store.refreshOrganisation()

  expect(get).toHaveBeenCalledTimes(2)
})

test('refresh fetches when there is nothing yet', async () => {
  const store = useOrgStore()
  await store.refreshOrganisation()

  expect(get).toHaveBeenCalledTimes(1)
})

test('a domain with no organisation is not asked again either', async () => {
  get.mockRejectedValue({ status: 404 })
  const store = useOrgStore()

  await store.fetchOrganisation()
  expect(store.organisationIsUnavailable).toBe(true)

  await store.refreshOrganisation()
  expect(get).toHaveBeenCalledTimes(1)
})

test('a failed fetch is not counted as having fetched', async () => {
  get.mockRejectedValue({ status: 500 })
  const store = useOrgStore()

  await expect(store.fetchOrganisation()).rejects.toEqual({ status: 500 })

  // Nothing was fetched, so the next refresh has to try
  get.mockResolvedValue(ORGANISATION)
  await store.refreshOrganisation()
  expect(get).toHaveBeenCalledTimes(2)
})
