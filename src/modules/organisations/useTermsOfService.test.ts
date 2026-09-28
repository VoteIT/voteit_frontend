import { DateTime } from 'luxon'
import { beforeEach, expect, test, vi } from 'vitest'

import type { TermsOfService } from './types'

vi.mock('./useOrgStore', () => ({ default: () => ({}) }))

const api = vi.hoisted(() => ({
  versions: [] as TermsOfService[],
  lists: 0
}))

vi.mock('./tosApi', () => ({
  listTos: async () => {
    api.lists++
    return api.versions
  },
  createTos: async (body: string) => {
    const tos = { ...api.versions[0], body, pk: 99 }
    api.versions = [tos, ...api.versions]
    return tos
  },
  updateTos: async (pk: number, body: string) => ({
    ...api.versions.find((v) => v.pk === pk)!,
    body
  })
}))

import useTermsOfService from './useTermsOfService'

function daysAgo(days: number) {
  return DateTime.now().minus({ days }).toISO()
}

function tos(pk: number, based_on: number, body: string, version: string) {
  return { pk, based_on, body, global_body: '', organisation: 1, version }
}

beforeEach(() => {
  api.versions = [tos(1, 1, '<p>Ours</p>', daysAgo(10))]
})

test('active is the newest version in effect', async () => {
  api.versions = [
    tos(3, 1, '<p>Coming</p>', daysAgo(-1)),
    tos(2, 1, '<p>Now</p>', daysAgo(1)),
    tos(1, 1, '<p>Old</p>', daysAgo(10))
  ]
  const { active, fetchTos, newest } = useTermsOfService()
  await fetchTos()
  expect(active.value?.pk).toBe(2)
  expect(newest.value?.pk).toBe(3)
})

test('added with new global terms and unchanged addition needs review', async () => {
  api.versions = [
    tos(2, 2, '<p>Ours</p>', daysAgo(1)),
    tos(1, 1, '<p>Ours</p>', daysAgo(10))
  ]
  const { fetchTos, needsReview } = useTermsOfService()
  await fetchTos()
  expect(needsReview.value).toBe(true)
})

test('changed addition or same global terms needs no review', async () => {
  const { fetchTos, needsReview } = useTermsOfService()
  await fetchTos()
  expect(needsReview.value).toBe(false) // Single version

  api.versions = [
    tos(2, 2, '<p>Reviewed</p>', daysAgo(1)),
    tos(1, 1, '<p>Ours</p>', daysAgo(10))
  ]
  await fetchTos()
  expect(needsReview.value).toBe(false)

  api.versions = [
    tos(2, 1, '<p>Ours</p>', daysAgo(1)),
    tos(1, 1, '<p>Ours</p>', daysAgo(10))
  ]
  await fetchTos()
  expect(needsReview.value).toBe(false)
})

test('correcting clears review, keeping the version', async () => {
  api.versions = [
    tos(2, 2, '<p>Ours</p>', daysAgo(1)),
    tos(1, 1, '<p>Ours</p>', daysAgo(10))
  ]
  const { fetchTos, needsReview, newest, saveTos, versions } =
    useTermsOfService()
  await fetchTos()
  await saveTos('<p>Ours, checked</p>', true)
  expect(newest.value).toMatchObject({ pk: 2, body: '<p>Ours, checked</p>' })
  expect(versions.value).toHaveLength(2)
  expect(needsReview.value).toBe(false)
})

test('publishing adds a version', async () => {
  const { fetchTos, newest, saveTos, versions } = useTermsOfService()
  await fetchTos()
  await saveTos('<p>New</p>', false)
  expect(newest.value).toMatchObject({ pk: 99, body: '<p>New</p>' })
  expect(versions.value).toHaveLength(2)
})

test('simultaneous fetches share one request', async () => {
  const { fetchTos, versions } = useTermsOfService()
  api.lists = 0
  await Promise.all([fetchTos(), fetchTos(), fetchTos()])
  expect(api.lists).toBe(1)
  expect(versions.value).toHaveLength(1)
  await fetchTos()
  expect(api.lists).toBe(2)
})
