import { DateTime } from 'luxon'
import { computed, shallowRef, watchEffect } from 'vue'

import * as tosApi from './tosApi'
import type { TermsOfService } from './types'
import useOrgStore from './useOrgStore'

/** Newest first */
const versions = shallowRef<TermsOfService[]>()

/** The newest version, which may not have taken effect yet. */
const newest = computed(() => versions.value?.[0])

export function isScheduled(tos: TermsOfService) {
  return DateTime.fromISO(tos.version) > DateTime.now()
}

/** The version in effect: the newest one that has taken effect. */
const active = computed(() => versions.value?.find((v) => !isScheduled(v)))

/**
 * A new version based on new global terms, with the organisation's addition
 * copied over unchanged - as the backend adds them when global terms change.
 * The addition should be checked against the new global terms.
 */
const needsReview = computed(() => {
  if (!versions.value) return
  const [latest, previous] = versions.value
  if (!previous) return false
  return latest.based_on !== previous.based_on && latest.body === previous.body
})

let pending: Promise<void> | undefined

/** Calls made while a fetch is under way share it. */
function fetchTos() {
  pending ??= tosApi
    .listTos()
    .then((data) => {
      versions.value = data
    })
    .finally(() => {
      pending = undefined
    })
  return pending
}

/**
 * @param correction Change the newest version in place, instead of publishing
 * a new one that users must accept.
 */
async function saveTos(body: string, correction: boolean) {
  if (correction) {
    if (!newest.value) throw new Error('No version to correct')
    const tos = await tosApi.updateTos(newest.value.pk, body)
    versions.value = versions.value?.map((v) => (v.pk === tos.pk ? tos : v))
  } else {
    // A scheduled version stays ahead of one taking effect now
    await tosApi.createTos(body)
    await fetchTos()
  }
}

/**
 * @param quietCheck Fetch terms of service if and when user may change the organisation. Errors are suppressed.
 */
export default function useTermsOfService(quietCheck = false) {
  const orgStore = useOrgStore()

  if (quietCheck)
    watchEffect(() => {
      // Once is enough for attention - the panel refreshes when opened
      if (orgStore.canChangeOrganisation && !versions.value)
        fetchTos().catch(() => {})
    })

  return {
    active,
    needsReview,
    newest,
    versions,
    fetchTos,
    saveTos
  }
}
