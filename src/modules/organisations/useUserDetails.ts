import { RoleContextKey } from '@/injectionKeys'
import { MeetingRoles, OrganisationRoles } from '@/composables/types'
import restApi from '@/utils/restApi'
import { socket } from '@/utils/Socket'
import { computed, inject, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'

import { User } from './types'

const userDetails = reactive(
  new Map<number, Omit<User, 'organisation' | 'organisation_roles'>>()
)

socket.addTypeHandler('user', ({ t, p }) => {
  const type = t.split('.')[1]
  switch (type) {
    case 'inv': {
      const { pk } = p as { pk: number }
      userDetails.delete(pk)
      break
    }
    default:
      console.warn(`Got unknown user message type '${type}'`)
  }
})

const fetchQueue = new Set<number>(new Set())
let fetchTimeout: NodeJS.Timeout
let loading = false
const TIMEOUT = 50

export default function useUserDetails() {
  const context = inject(RoleContextKey, 'organisation')
  const { params } = useRoute()
  const contextId = computed(() => (params.id ? Number(params.id) : undefined))
  const endpoint = `${context}-roles/`

  watch(contextId, () => {
    fetchQueue.clear()
    clearTimeout(fetchTimeout)
  })

  async function fetchMultiple() {
    // Fetch all queued users (rest)
    const missing = [...fetchQueue].filter((pk) => !userDetails.has(pk))
    if (loading || !missing.length) return
    const params = {
      context: contextId.value,
      user_id_in: missing.join(',')
    }
    fetchQueue.clear()
    loading = true
    try {
      const { data } = await restApi.get<MeetingRoles[] | OrganisationRoles[]>(
        endpoint,
        { params }
      )
      for (const { user } of data) {
        userDetails.set(user.pk, user)
      }
    } catch {}
    loading = false
    // Any new queued
    if (fetchQueue.size) fetchMultiple()
  }

  function fetchUserDetails(user: number) {
    // Avoid getting participants in several requests by queueing, and setting a short timeout.
    if (!fetchQueue.has(user)) {
      fetchQueue.add(user)
      clearTimeout(fetchTimeout)
      fetchTimeout = setTimeout(fetchMultiple, TIMEOUT)
    }
  }

  /**
   * To be used in computed objects. Returns user object if in storage.
   * If not in storage, fetch user from API, using queue system.
   * @param user User primary key
   */
  function getUser(user: number) {
    // Queue for fetch if not in store
    if (!userDetails.has(user)) fetchUserDetails(user)
    return userDetails.get(user)
  }

  return {
    getUser
  }
}
