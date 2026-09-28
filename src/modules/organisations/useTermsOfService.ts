import { DateTime } from 'luxon'
import { computed, shallowRef, watchEffect } from 'vue'

import * as tosApi from './tosApi'
import type { CurrentTermsOfService, GlobalTermsOfService } from './types'
import useOrgStore from './useOrgStore'

const current = shallowRef<CurrentTermsOfService>()
/** Newest first */
const globalVersions = shallowRef<GlobalTermsOfService[]>()

/**
 * Global terms were published after the version in effect, so the
 * organisation's addition should be checked against them. Clears when a new
 * version is published - a correction keeps its date.
 */
const needsReview = computed(() => current.value?.newer_global_tos)

/** Our version in effect. Null when the organisation has no terms of its own. */
const organisationTos = computed(() => current.value?.organisation_tos)

/** Global versions published after ours in effect, newest first. */
const newerGlobalVersions = computed(() => {
  const tos = organisationTos.value
  if (!tos || !globalVersions.value) return []
  const version = DateTime.fromISO(tos.version)
  return globalVersions.value.filter(
    (g) => DateTime.fromISO(g.version) > version
  )
})

/** Calls made while a fetch is under way share it. */
function shared(fetch: () => Promise<void>) {
  let pending: Promise<void> | undefined
  return () =>
    (pending ??= fetch().finally(() => {
      pending = undefined
    }))
}

/** Enough to tell whether the control panel needs attention. */
const fetchCurrent = shared(async () => {
  current.value = await tosApi.getCurrentTos()
})

/** What has changed in the global terms, for reviewing ours. */
const fetchGlobalVersions = shared(async () => {
  globalVersions.value = await tosApi.listGlobalTos()
})

/**
 * Publishing a version, even with an unchanged body, rolls out the global
 * terms published before it and clears `needsReview`.
 * @param correction Change the version in effect in place, instead of
 * publishing a new one that users must accept.
 */
async function saveTos(body: string, correction: boolean) {
  if (correction) {
    if (!organisationTos.value || !current.value)
      throw new Error('No version to correct')
    const tos = await tosApi.updateTos(organisationTos.value.pk, body)
    current.value = { ...current.value, organisation_tos: tos }
  } else {
    await tosApi.createTos(body)
    await fetchCurrent()
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
      if (orgStore.canChangeOrganisation && !current.value)
        fetchCurrent().catch(() => {})
    })

  return {
    current,
    globalVersions,
    needsReview,
    newerGlobalVersions,
    organisationTos,
    fetchCurrent,
    fetchGlobalVersions,
    saveTos
  }
}
