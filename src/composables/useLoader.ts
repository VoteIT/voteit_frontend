import { socketState } from '@/contentTypes/Channel'
import { computed, ref, watch } from 'vue'

import useAuthentication from './useAuthentication'

const initDone = ref(false)
const initFailed = ref(false)
let callbacks: CallableFunction[] = []

const { isAuthenticated } = useAuthentication()

const isReady = computed(() => {
  return isAuthenticated.value && socketState.value
})

watch(isReady, value => {
  if (value) {
    Promise.all(
      callbacks.map(cb => cb())
    )
      .then(() => {
        initDone.value = true
      })
      .catch(err => {
        console.log(err)
        initFailed.value = true
      })
      .finally(() => {
        callbacks = []
      })
  }
})

export default function useLoader (name: string) {
  if (typeof name !== 'string') {
    console.error('Warning: Instantiate loader using userLoader(<unique name>)')
  }
  function setLoaded (success = true) {
    if (success) {
      initDone.value = true
      return
    }
    console.error('Loading failed', name)
    initFailed.value = true
  }

  function call (cb: CallableFunction) {
    // Queue if not initialized.
    if (initDone.value) {
      cb()
    } else {
      callbacks.push(cb)
    }
  }

  function subscribe (channel: any, uriOrPk: string | number) {
    // TODO Interface not any ^^ of some kind for channel
    if (initDone.value) {
      return channel.subscribe(uriOrPk)
    } else {
      return new Promise((resolve, reject) => {
        callbacks.push(() => {
          channel.subscribe(uriOrPk, true)
            .then(resolve)
            .catch((err: Error) => {
              console.log('Loading failed', name)
              reject(err)
            })
        })
      })
    }
  }

  return {
    initDone,
    initFailed,
    setLoaded,
    call,
    subscribe
  }
}
