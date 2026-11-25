import { filter, ifilter } from 'itertools'
import { computed, onBeforeMount, Ref, shallowReactive } from 'vue'
import { dialogAlert } from '@/utils'
import ContentType from '@/contentTypes/ContentType'
import { AccessPolicy, AccessPolicyType } from '@/contentTypes/types'

import { accessPolicyType } from '../contentTypes'
import { automaticAccessType } from './contentTypes'
import { MeetingRole } from '../types'

const policyStore = shallowReactive<Map<number, AccessPolicy>>(new Map())
const contentTypes: Partial<
  Record<AccessPolicyType, ContentType<AccessPolicy>>
> = {
  automatic: automaticAccessType
}

const loadedMeetings = shallowReactive(new Set<number>())
const pending = new Map<number, Promise<void>>()

async function fetchPolicies(meeting: number) {
  const data = await accessPolicyType.api.retrieve(meeting)
  // Start by removing any policies in store that's not in response
  const newPks = data.policies.map((p) => p.pk)
  for (const { pk } of ifilter(
    policyStore.values(),
    (p) => p.meeting === meeting && !newPks.includes(p.pk)
  )) {
    policyStore.delete(pk)
  }
  for (const p of data.policies) {
    policyStore.set(p.pk, p)
  }
  loadedMeetings.add(meeting)
}

/**
 * Fetch access policies for a meeting, replacing what the store holds for it.
 * Concurrent calls for the same meeting share one request. Throws on failure.
 */
export function fetchAccessPolicies(meeting: number) {
  let request = pending.get(meeting)
  if (!request) {
    request = fetchPolicies(meeting).finally(() => pending.delete(meeting))
    pending.set(meeting, request)
  }
  return request
}

/**
 * Fetch access policies for a meeting, alerting the user on failure.
 */
export async function loadAccessPolicies(meeting: number) {
  try {
    await fetchAccessPolicies(meeting)
  } catch {
    dialogAlert('Could not load access policies for meeting.')
  }
}

/**
 * Fetch access policies for a meeting once, in the background.
 * Failures are ignored, leaving the meeting marked as not loaded.
 */
export function loadAccessPoliciesQuietly(meeting: number) {
  if (loadedMeetings.has(meeting)) return
  fetchAccessPolicies(meeting).catch(() => {})
}

/**
 * Access policies for a meeting, as currently in store. Doesn't fetch.
 */
export function useAccessPolicyState(meetingId: Ref<number>) {
  const accessPolicies = computed(() =>
    filter(policyStore.values(), (p) => p.meeting === meetingId.value)
  )
  const hasActivePolicy = computed(() =>
    accessPolicies.value.some((p) => p.active)
  )
  const isLoaded = computed(() => loadedMeetings.has(meetingId.value))
  return { accessPolicies, hasActivePolicy, isLoaded }
}

export default function useAccessPolicies(meetingId: Ref<number>) {
  const { accessPolicies, hasActivePolicy } = useAccessPolicyState(meetingId)

  function getContentType(p: Pick<AccessPolicy, 'name'>) {
    const ct = contentTypes[p.name]
    if (!ct) throw new Error(`No API for access policy type "${p.name}"`)
    return ct
  }

  async function addPolicy(
    p: Pick<AccessPolicy, 'meeting' | 'name' | 'roles_given'>
  ) {
    const { api } = getContentType(p)
    const data = await api.add(p)
    policyStore.set(data.pk, data)
  }

  async function deletePolicy(p: AccessPolicy) {
    const { api } = getContentType(p)
    try {
      await api.delete(p.pk)
      policyStore.delete(p.pk)
    } catch {
      dialogAlert('Could not delete access policy')
    }
  }

  async function setActive(p: AccessPolicy, active: boolean) {
    const { api } = getContentType(p)
    try {
      const data = await api.patch(p.pk, {
        active
      })
      policyStore.set(data.pk, data)
    } catch {
      dialogAlert('Could not change active state')
    }
  }

  async function setRoles(p: AccessPolicy, rolesGiven: MeetingRole[]) {
    const { api } = getContentType(p)
    try {
      const data = await api.patch(p.pk, {
        roles_given: rolesGiven
      })
      policyStore.set(data.pk, data)
    } catch {
      dialogAlert('Could not set roles')
    }
  }

  onBeforeMount(() => loadAccessPolicies(meetingId.value))

  return {
    accessPolicies,
    hasActivePolicy,
    addPolicy,
    deletePolicy,
    setActive,
    setRoles
  }
}
