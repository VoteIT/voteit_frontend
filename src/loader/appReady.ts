import { computed, shallowRef, watch } from 'vue'

import { InitState } from '@/composables/types'
import { fetchStateMachines } from '@/composables/useStateMachine'
import { socket, socketState } from '@/socket'
import { SocketState } from '@/socket/types'
import useAuthStore from '@/modules/auth/useAuthStore'
import useOrgStore from '@/modules/organisations/useOrgStore'

import { trackBoot } from './registry'

const bootState = shallowRef<InitState>()
const failedMessage = shallowRef<string>()

/** Whether the full-screen boot splash is still covering the app. */
export const bootDone = computed(() => bootState.value === InitState.Done)
export const bootFailed = computed(() => bootState.value === InitState.Failed)

/**
 * Settles once the app has everything a route guard may rely on: the
 * authenticated user, the organisation, the state machines, and - for a signed
 * in user - an open socket to subscribe channels on.
 *
 * A failed boot leaves this pending for good. There is nothing to navigate to
 * without it, and the splash stays up saying so.
 */
let resolveReady: () => void
export const appReady = new Promise<void>((resolve) => {
  resolveReady = resolve
})

function isError(e: unknown): e is Error {
  return e !== null && typeof e === 'object' && 'message' in e
}

/**
 * Say why the app couldn't be brought up, for the splash to show under its
 * "loading failed". First one wins: what went first is what explains the rest.
 */
export function reportLoadFailure(e: unknown) {
  if (!failedMessage.value && isError(e)) failedMessage.value = e.message
}

/** Resolves as soon as the socket is open, immediately if it already is. */
function whenSocketOpen() {
  if (socketState.value === SocketState.Open) return Promise.resolve()
  return new Promise<void>((resolve) => {
    const stop = watch(socketState, (state) => {
      if (state !== SocketState.Open) return
      stop()
      resolve()
    })
  })
}

/**
 * Fetch what the app can't start without. Call once, after pinia is installed
 * and before the router runs its first navigation - the guard awaits
 * `appReady`, so nothing is loaded or mounted until this is through.
 */
export async function startAppLoad() {
  if (bootState.value !== undefined) return appReady
  bootState.value = InitState.Loading
  // One step on the loader, moving a quarter at a time. Four parts and not
  // three: the socket below is part of getting the app up, and leaving it out
  // would show the step finished while we were still connecting. An anonymous
  // visitor has no socket to wait for, so their fourth part lands at once.
  const PARTS = 4
  const reportBoot = trackBoot()
  let done = 0
  const part = <T>(promise: Promise<T>) =>
    promise.then((value) => {
      reportBoot(++done, PARTS)
      return value
    })

  try {
    const [user] = await Promise.all([
      part(useAuthStore().fetchAuthenticatedUser()),
      part(useOrgStore().fetchOrganisation()),
      part(fetchStateMachines())
    ])
    // An anonymous visitor gets no socket - and shouldn't wait for one.
    if (user) {
      socket.connect()
      await whenSocketOpen()
    }
    reportBoot(PARTS, PARTS)
    bootState.value = InitState.Done
    resolveReady()
  } catch (e) {
    console.error('App loading failed', e)
    reportLoadFailure(e)
    bootState.value = InitState.Failed
  }
  return appReady
}

export default function useAppReady() {
  return {
    bootState,
    bootDone,
    bootFailed,
    failedMessage
  }
}
