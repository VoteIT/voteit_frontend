import { socket } from '@/socket'
import TypedEvent from '@/utils/TypedEvent'

import useAuthStore from './useAuthStore'

/**
 * 'user.inv' tells us a user's details changed. `useUserDetails` drops its
 * cached copy of anyone else, but the signed-in user lives in the auth store
 * and carries fields only /api/user sends (roles, member ids), so fetch that
 * again when it's about us.
 *
 * Registered here rather than in the store's setup for the same reason as
 * `./sessionEnd`: the socket outlives any one pinia instance.
 */

/**
 * Fires when the server says the signed-in user changed. For views showing
 * something about the account that /api/user doesn't carry, like its
 * connections, to fetch that again while they're on screen.
 */
export const selfInvalidatedEvent = new TypedEvent()

// The server sometimes sends the same invalidation more than once in quick
// succession, so wait for it to settle and refresh once.
const DEBOUNCE = 100
let timeout: ReturnType<typeof setTimeout> | undefined

function refresh() {
  timeout = undefined
  const store = useAuthStore()
  // Signed out while we waited
  if (!store.user) return
  selfInvalidatedEvent.emit()
  store.fetchAuthenticatedUser().catch((e) => {
    console.error('Failed to refresh authenticated user', e)
  })
}

socket.registerTypeHandler('user', ({ action, payload }) => {
  if (action !== 'inv') return
  const store = useAuthStore()
  const { pk } = payload as { pk: number }
  if (!store.user || store.user.pk !== pk) return
  clearTimeout(timeout)
  timeout = setTimeout(refresh, DEBOUNCE)
})
