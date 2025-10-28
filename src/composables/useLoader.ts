import { computed, shallowRef } from 'vue'

import { clearAlertsEvent } from '@/utils/events'

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
  if (!!initState.value) return cbs.forEach((cb) => cb())
  cbs.forEach((cb) => callbacks.push(cb))
}

function reset() {
  clearAlertsEvent.emit()
  performLoad()
}

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
    reset,
    setLoaded,
    call
  }
}
