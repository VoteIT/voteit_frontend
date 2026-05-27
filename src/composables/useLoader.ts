import { computed, shallowRef } from 'vue'

import { InitState } from './types'
import { readyToLoadEvent } from './events'

export type LoaderCallback = () => Promise<unknown>
let callbacks: LoaderCallback[] = []

const initState = shallowRef<InitState>()
const initFailed = computed(() => initState.value === InitState.Failed)
const initDone = computed(() => initState.value === InitState.Done)
// const isReady = computed(() => isAuthenticated.value && socketState.value)

async function _failure(name?: string) {
  console.error('Loading failed', name)
  initState.value = InitState.Failed
}

function _success() {
  initState.value = InitState.Done
}

async function performLoad() {
  initState.value = InitState.Loading
  try {
    await Promise.all(callbacks.map((cb) => cb()))
    _success()
  } catch {
    _failure()
  }
  callbacks = []
}

readyToLoadEvent.once(performLoad)

function call(...cbs: (() => Promise<unknown>)[]) {
  // If it has an init state, load is already started. Therefore, call immediately.
  if (initState.value !== undefined) return cbs.forEach((cb) => cb())
  cbs.forEach((cb) => callbacks.push(cb))
}

/**
 * Tracks global app initialisation state. Pass the promises that must
 * resolve before the app is considered ready. Resolves them in parallel
 * when the `readyToLoadEvent` fires (i.e. after authentication).
 *
 * @param name - Human-readable label used in error logging
 * @param promises - Async operations that must complete during initialisation
 * @returns `{ initDone, initFailed, initState, setLoaded, call }`
 */
export default function useLoader(
  name: string,
  ...promises: Promise<unknown>[]
) {
  function setLoaded(success = true) {
    if (success) _success()
    else _failure(name)
  }

  call(() => Promise.all(promises))

  return {
    initDone,
    initFailed,
    initState,
    setLoaded,
    call
  }
}
