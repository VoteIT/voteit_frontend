import { computed, ref, watch } from 'vue'
import Channel, { socketState } from '@/contentTypes/Channel'

import useAuthentication from './useAuthentication'

const initDone = ref(false)
const initFailed = ref(false)
let callbacks: (() => Promise<unknown>)[] = []

const { isAuthenticated } = useAuthentication()

const isReady = computed(() => {
  return isAuthenticated.value && socketState.value
})

watch(isReady, async value => {
  if (!value) return
  try {
    await Promise.all(callbacks.map(cb => cb()))
    initDone.value = true
  } catch (err) {
    console.log(err)
    initFailed.value = true
  }
  callbacks = []
})

export default function useLoader (name: string) {
  if (typeof name !== 'string') {
    console.error('Warning: Instantiate loader using userLoader(<unique name>)')
  }
  function setLoaded (success = true) {
    if (success) {
      initDone.value = true
    } else {
      console.error('Loading failed', name)
      initFailed.value = true
    }
  }

  function call (...cbs: (() => Promise<unknown>)[]) {
    // Queue if not initialized.
    cbs.forEach(cb => {
      if (initDone.value) cb()
      else callbacks.push(cb)
    })
  }

  async function subscribe<T> (channel: Channel<T>, uriOrPk: string | number) {
    if (initDone.value) return channel.subscribe(uriOrPk)
    return new Promise<void>((resolve, reject) => {
      callbacks.push(async () => {
        try {
          await channel.subscribe(uriOrPk, true)
          resolve()
        } catch (err) {
          console.log('Loading failed', name)
          reject(err)
        }
      })
    })
  }

  return {
    initDone,
    initFailed,
    setLoaded,
    call,
    subscribe
  }
}
