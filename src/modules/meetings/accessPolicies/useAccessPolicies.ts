import { computed, onBeforeMount, reactive, Ref } from 'vue'
import { mapFilter } from '@/utils'
import useAlert from '@/composables/useAlert'
import ContentType from '@/contentTypes/ContentType'
import { AccessPolicy, AccessPolicyType } from '@/contentTypes/types'

import { accessPolicyType } from '../contentTypes'
import { automaticAccessType } from './contentTypes'
import { MeetingRole } from '../types'

const policyStore = reactive<Map<number, AccessPolicy>>(new Map())
const contentTypes: Partial<Record<AccessPolicyType, ContentType<AccessPolicy>>> = {
  automatic: automaticAccessType
}

const { alert } = useAlert()

export default function useAccessPolicies (meetingId: Ref<number>) {
  const accessPolicies = computed(() => [...mapFilter(policyStore, p => p.meeting === meetingId.value)])

  function getContentType (p: AccessPolicy) {
    const ct = contentTypes[p.name]
    if (!ct) throw new Error(`No API for access policy type "${p.name}"`)
    return ct
  }

  async function deletePolicy (p: AccessPolicy) {
    const { api } = getContentType(p)
    try {
      await api.delete(p.pk)
      policyStore.delete(p.pk)
    } catch {
       alert('*Cound not delete access policy')
    }
  }

  async function setActive (p: AccessPolicy, active: boolean) {
    const { api } = getContentType(p)
    try {
      const { data } = await api.patch(p.pk, {
        active
      })
      policyStore.set(data.pk, data)
    } catch {
      alert('*Could not change active state')
    }
  }

  async function setRoles (p: AccessPolicy, rolesGiven: MeetingRole[]) {
    const { api } = getContentType(p)
    try {
      const { data } = await api.patch(p.pk, {
        roles_given: rolesGiven
      })
      policyStore.set(data.pk, data)
    } catch {
      alert('*Could not set roles')
    }
  }

  onBeforeMount(async () => {
    // Store meeting id in scope
    const meeting = meetingId.value
    try {
      const { data } = await accessPolicyType.api.retrieve(meeting)
      // Start by removing any policies in store that's not in response
      const newPks = data.policies.map(p => p.pk)
      for (const { pk } of mapFilter(policyStore, p => p.meeting === meeting && !newPks.includes(p.pk))) {
        policyStore.delete(pk)
      }
      for (const p of data.policies) {
        policyStore.set(p.pk, p)
      }
    } catch {
      alert('*Could not load access policies for meeting.')
    }
  })

  return {
    accessPolicies,
    deletePolicy,
    setActive,
    setRoles
  }
}
