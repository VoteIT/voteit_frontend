import { computed, shallowRef, watchEffect } from 'vue'

import type { RequirementFactory } from '@/loader/types'
import { shared } from '@/utils'
import restApi, { isApiError } from '@/utils/restApi'

import type { RemovalRequest } from './types'
import useOrgStore from './useOrgStore'

/** Oldest first. Undefined until fetched. */
const requests = shallowRef<RemovalRequest[]>()

/** Someone is waiting for a manager to remove them. */
const requiresAttention = computed(() =>
  requests.value?.some((r) => r.can_remove)
)

const fetchRequests = shared(async () => {
  requests.value = await restApi.get<RemovalRequest[]>('removal-requests/')
})

function dropRequest(user: number) {
  requests.value = requests.value?.filter((r) => r.user.pk !== user)
}

/**
 * Deletes the user if nothing references them, anonymises them otherwise.
 * A 404 means the request is gone - withdrawn, or handled by someone else -
 * so the list is fetched again before rethrowing.
 */
async function removeUser(user: number) {
  try {
    const { result } = await restApi.post<{
      result: 'deleted' | 'anonymised'
    }>(`removal-requests/${user}/remove/`)
    dropRequest(user)
    return result
  } catch (e) {
    if (isApiError(e) && e.status === 404) {
      dropRequest(user)
      fetchRequests().catch(() => {})
    }
    throw e
  }
}

/**
 * Fetched again whenever the panel opens - requests come and go, and
 * `can_remove` changes with time. The panel shows up without them.
 */
export const removalRequestsPanelRequirement: RequirementFactory = (to) => {
  if (to.params.panel !== 'removalRequests') return
  return {
    key: 'removal-requests',
    async load() {
      if (useOrgStore().canChangeOrganisation) await fetchRequests()
    }
  }
}

/**
 * @param quietCheck Fetch requests once the user may change the organisation, for the attention count. Errors are suppressed.
 */
export default function useRemovalRequests(quietCheck = false) {
  const orgStore = useOrgStore()

  if (quietCheck)
    watchEffect(() => {
      if (orgStore.canChangeOrganisation && !requests.value)
        fetchRequests().catch(() => {})
    })

  return {
    requests,
    requiresAttention,
    fetchRequests,
    removeUser
  }
}
