import { beforeEach, expect, test, vi } from 'vitest'

import { ApiError } from '@/utils/restApi'

import { RemovalClassification, type RemovalRequest } from './types'
import useRemovalRequests from './useRemovalRequests'

vi.mock('./useOrgStore', () => ({ default: () => ({}) }))

const api = vi.hoisted(() => ({
  requests: [] as RemovalRequest[],
  gets: 0,
  /** Status to fail the next remove with */
  removeStatus: undefined as number | undefined
}))

vi.mock('@/utils/restApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/utils/restApi')>()
  return {
    ...original,
    default: {
      async get() {
        api.gets++
        return api.requests
      },
      async post(url: string) {
        if (api.removeStatus)
          throw new original.ApiError(
            api.removeStatus,
            {},
            new Headers(),
            'failed'
          )
        const pk = Number(url.split('/')[1])
        api.requests = api.requests.filter((r) => r.user.pk !== pk)
        return { result: 'deleted' }
      }
    }
  }
})

function makeRequest(pk: number, can_remove = true): RemovalRequest {
  return {
    user: { pk, first_name: '', last_name: '', userid: `u${pk}` } as never,
    removal_requested: '2026-11-10T10:00:00Z',
    removable_after: '2026-11-10T13:00:00Z',
    can_remove,
    organisation_roles: [],
    classification: RemovalClassification.NoActivity,
    meetings: []
  }
}

beforeEach(async () => {
  api.requests = [makeRequest(1, false), makeRequest(2)]
  api.gets = 0
  api.removeStatus = undefined
  await useRemovalRequests().fetchRequests()
})

test('fetch fills requests, attention follows can_remove', async () => {
  const { requests, requiresAttention, fetchRequests } = useRemovalRequests()
  expect(requests.value?.map((r) => r.user.pk)).toEqual([1, 2])
  expect(requiresAttention.value).toBe(true)
  api.requests = [makeRequest(1, false)]
  await fetchRequests()
  expect(requiresAttention.value).toBe(false)
})

test('removing drops the row', async () => {
  const { requests, removeUser } = useRemovalRequests()
  expect(await removeUser(2)).toBe('deleted')
  expect(requests.value?.map((r) => r.user.pk)).toEqual([1])
})

test('a request that is gone is dropped and refetched', async () => {
  const { requests, removeUser } = useRemovalRequests()
  api.removeStatus = 404
  api.requests = [makeRequest(1, false)]
  const gets = api.gets
  await expect(removeUser(2)).rejects.toBeInstanceOf(ApiError)
  expect(requests.value?.map((r) => r.user.pk)).toEqual([1])
  await vi.waitFor(() => expect(api.gets).toBe(gets + 1))
})

test('other errors leave the list alone', async () => {
  const { requests, removeUser } = useRemovalRequests()
  api.removeStatus = 400
  await expect(removeUser(1)).rejects.toBeInstanceOf(ApiError)
  expect(requests.value?.map((r) => r.user.pk)).toEqual([1, 2])
})
