import { socket } from '@/socket'

import useAuthStore from './useAuthStore'

/**
 * The server closes the socket when the session ends somewhere else - a logout
 * in another tab, or one the backend decided on. Drop the user here too, so the
 * app knows it's anonymous rather than trying to reconnect forever: with
 * `isAuthenticated` false, `OnlineStatus` stops its reconnect ticker and closes
 * the socket, and the meeting rules turn `usePermission` into a login prompt.
 *
 * Registered here rather than in the store's setup because the socket is a
 * module singleton and this handler is never disposed - it must not close over
 * one pinia instance's store.
 */
socket.onLoggedOut(() => {
  useAuthStore().clearUser()
})
