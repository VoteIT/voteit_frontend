import { computed, ref, watch } from 'vue'

import { clearAlertsEvent } from '@/utils/events'
import { socketState } from '@/utils/Socket'
import Channel from '@/contentTypes/Channel'

import useAuthentication from './useAuthentication'
import { InitState } from './types'

const { isAuthenticated } = useAuthentication()

let callbacks: (() => Promise<unknown>)[] = []

const initState = ref(InitState.Loading)
const initFailed = computed(() => initState.value === InitState.Failed)
const initDone = computed(() => initState.value === InitState.Done)
const isReady = computed(() => {
  return isAuthenticated.value && socketState.value
})

async function _failure (name?: string) {
  console.error('Loading failed', name)
  initState.value = InitState.Failed
}

function _success () {
  initState.value = InitState.Done
}

async function performLoad () {
  try {
    await Promise.all(callbacks.map(cb => cb()))
    _success()
  } catch {
    _failure()
  }
  callbacks = []
}

watch(isReady, value => {
  if (!value) return
  performLoad()
})

function call (...cbs: (() => Promise<unknown>)[]) {
  // If isReady, load is already performed. Therefore, call immediately.
  if (isReady.value) return cbs.forEach(cb => cb())
  cbs.forEach(cb => callbacks.push(cb))
}

function reset () {
  initState.value = InitState.Loading
  clearAlertsEvent.emit()
  performLoad()
}

export default function useLoader (name: string) {
  function setLoaded (success = true) {
    if (success) _success()
    else _failure(name)
  }

  async function subscribe (channel: Channel, uriOrPk: string | number) {
    // If isReady, load is already performed. Therefore, call immediately.
    if (isReady.value) return channel.subscribe(uriOrPk)
    return new Promise<void>((resolve, reject) => {
      callbacks.push(async () => {
        try {
          await channel.subscribe(uriOrPk, true)
          resolve()
        } catch (err) {
          reject(err) // Fail in promise
          throw err // Fail in loader
        }
      })
    })
  }

  return {
    initDone,
    initFailed,
    initState,
    reset,
    setLoaded,
    call,
    subscribe
  }
}
