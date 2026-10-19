import { storeToRefs } from 'pinia'
import { computed, shallowRef, watch } from 'vue'
import { useIdle, useIntervalFn } from '@vueuse/core'

import useAuthStore from '../auth/useAuthStore'
import useInviteStore from './useInviteStore'

/**
 * Periodically fetch invitations matching the current user.
 * Polls less often while user is idle.
 */
export default function usePolledInvites() {
  const inviteStore = useInviteStore()
  const { user } = storeToRefs(useAuthStore())
  /** True after first fetch for current user has completed (or failed) */
  const invitesLoaded = shallowRef(false)

  async function fetchInvitesIfAuthenticated() {
    if (!user.value) return
    try {
      await inviteStore.fetchMatchedInvites()
    } catch (e) {
      // Polled in the background — don't interrupt the user on every failure
      console.warn(e)
    }
    invitesLoaded.value = true
  }

  watch(user, () => {
    invitesLoaded.value = false
    inviteStore.clearMatchedInvites()
    fetchInvitesIfAuthenticated()
  })
  const { idle } = useIdle()
  useIntervalFn(
    fetchInvitesIfAuthenticated,
    computed(() => (idle.value ? 600_000 : 15_000)),
    { immediateCallback: true }
  )

  const { matchedInvites } = storeToRefs(inviteStore)

  return { invitesLoaded, matchedInvites }
}
