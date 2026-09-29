import { DateTime } from 'luxon'
import { beforeEach, expect, test, vi } from 'vitest'

import type { GlobalTermsOfService, TermsOfService } from './types'

vi.mock('./useOrgStore', () => ({ default: () => ({}) }))

const api = vi.hoisted(() => ({
  versions: [] as TermsOfService[],
  globalVersions: [] as GlobalTermsOfService[],
  newerGlobal: false,
  globalLists: 0,
  lists: 0,
  currents: 0
}))

vi.mock('./tosApi', () => ({
  listTos: async () => {
    api.lists++
    return api.versions
  },
  listGlobalTos: async () => {
    api.globalLists++
    return api.globalVersions
  },
  getCurrentTos: async () => {
    api.currents++
    return {
      organisation_tos: api.versions.find(
        (v) => DateTime.fromISO(v.version) <= DateTime.now()
      ),
      newer_global_tos: api.newerGlobal
    }
  },
  createTos: async (body: string) => {
    const tos = { ...api.versions[0], body, pk: 99, version: daysAgo(0) }
    api.versions = [tos, ...api.versions]
    api.newerGlobal = false
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

function tos(pk: number, body: string, version: string) {
  return { pk, body, organisation: 1, version }
}

function globalTos(pk: number, version: string) {
  return { pk, body: '', notes: '', required_from: version, version }
}

beforeEach(() => {
  api.versions = [tos(1, '<p>Ours</p>', daysAgo(10))]
  api.globalVersions = []
  api.newerGlobal = false
})

test('lists the global versions since the one ours is based on', async () => {
  api.versions = [tos(1, '<p>Ours</p>', daysAgo(5))]
  api.globalVersions = [
    globalTos(3, daysAgo(1)),
    globalTos(2, daysAgo(3)),
    globalTos(1, daysAgo(10)),
    globalTos(0, daysAgo(20))
  ]
  const {
    baseGlobalVersion,
    fetchCurrent,
    fetchGlobalVersions,
    globalVersionsToReview
  } = useTermsOfService()
  await Promise.all([fetchCurrent(), fetchGlobalVersions()])
  expect(globalVersionsToReview.value.map((g) => g.pk)).toEqual([1, 2, 3])
  expect(baseGlobalVersion.value?.pk).toBe(1)
})

test('newer global terms need review until a new version is published', async () => {
  const { fetchCurrent, needsReview, saveTos } = useTermsOfService()
  await fetchCurrent()
  expect(needsReview.value).toBe(false)

  api.newerGlobal = true
  await fetchCurrent()
  expect(needsReview.value).toBe(true)

  await saveTos('<p>Ours, checked</p>', false)
  expect(needsReview.value).toBe(false)
})

test('correcting changes the version in effect, keeping its date', async () => {
  api.versions = [
    tos(3, '<p>Coming</p>', daysAgo(-1)),
    tos(2, '<p>Ours</p>', daysAgo(1)),
    tos(1, '<p>Old</p>', daysAgo(10))
  ]
  const { fetchCurrent, organisationTos, saveTos } = useTermsOfService()
  await fetchCurrent()
  await saveTos('<p>Ours, fixed</p>', true)
  expect(organisationTos.value).toMatchObject({
    pk: 2,
    body: '<p>Ours, fixed</p>',
    version: api.versions[1].version
  })
})

test('our history is oldest first, and follows corrections', async () => {
  api.versions = [
    tos(2, '<p>Ours</p>', daysAgo(1)),
    tos(1, '<p>Old</p>', daysAgo(10))
  ]
  const { fetchCurrent, fetchVersions, saveTos, versions } = useTermsOfService()
  await Promise.all([fetchCurrent(), fetchVersions()])
  expect(versions.value?.map((v) => v.pk)).toEqual([1, 2])
  await saveTos('<p>Ours, fixed</p>', true)
  expect(versions.value?.[1]).toMatchObject({ body: '<p>Ours, fixed</p>' })
})

test('publishing leaves our history to be fetched again', async () => {
  const { fetchCurrent, fetchVersions, saveTos, versions } = useTermsOfService()
  await Promise.all([fetchCurrent(), fetchVersions()])
  await saveTos('<p>New</p>', false)
  expect(versions.value).toBeUndefined()
})

test('publishing a version makes it the one in effect', async () => {
  const { fetchCurrent, organisationTos, saveTos } = useTermsOfService()
  await fetchCurrent()
  await saveTos('<p>New</p>', false)
  expect(organisationTos.value).toMatchObject({ pk: 99, body: '<p>New</p>' })
})

test('simultaneous fetches share one request', async () => {
  const { fetchCurrent, fetchGlobalVersions } = useTermsOfService()
  api.globalLists = 0
  api.currents = 0
  await Promise.all([fetchCurrent(), fetchCurrent(), fetchGlobalVersions()])
  expect(api.currents).toBe(1)
  expect(api.globalLists).toBe(1)
  await fetchCurrent()
  expect(api.currents).toBe(2)
})

test('the current terms alone leave the lists unfetched', async () => {
  const { fetchCurrent } = useTermsOfService()
  api.globalLists = 0
  api.lists = 0
  await fetchCurrent()
  expect(api.globalLists).toBe(0)
  expect(api.lists).toBe(0)
})
