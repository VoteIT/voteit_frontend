import { ref, watch } from 'vue'

import useAuthentication from './useAuthentication'
import useRestApi from './useRestApi'

const initDone = ref(false)
const initFailed = ref(false)
let callbacks = []

const { isAuthenticated } = useAuthentication()

const restApi = useRestApi({ alertOnError: false })

watch(isAuthenticated, value => {
  if (value) {
    Promise.all(
      callbacks.map(cb => cb())
    )
      .then(_ => {
        initDone.value = true
      })
      .catch(err => {
        console.log(err)
        initFailed.value = true
      })
      .finally(_ => {
        callbacks = []
      })
  }
})

export default function useLoader (name) {
  if (typeof name !== 'string') {
    console.log('Warning: Instantiate loader using userLoader(<unique name>)')
  }
  function setLoaded (success = true) {
    if (success) {
      initDone.value = true
    } else {
      console.log('Loading failed', name)
      initFailed.value = true
    }
  }

  function call (cb) {
    // Queue if not initialized. Need to check that...
    if (isAuthenticated.value) {
      cb()
    } else {
      callbacks.push(cb)
    }
  }

  async function get (uri, config) {
    if (isAuthenticated.value) {
      return restApi.get(uri, config)
    } else {
      return new Promise((resolve, reject) => {
        callbacks.push(_ => {
          restApi.get(uri, config)
            .then(resolve)
            .catch(err => {
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
    get
  }
}
