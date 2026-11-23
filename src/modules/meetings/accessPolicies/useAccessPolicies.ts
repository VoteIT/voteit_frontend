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

/**
 * Fetch access policies for a meeting, replacing what the store holds for it.
 */
export async function loadAccessPolicies(meeting: number) {
  try {
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
  } catch {
    dialogAlert('Could not load access policies for meeting.')
  }
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
  return { accessPolicies, hasActivePolicy }
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
