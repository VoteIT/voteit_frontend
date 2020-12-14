import { ref, watch } from 'vue'

import useAuthentication from './useAuthentication'

const loading = new Set() // Set of component names that are loading.
const initDone = ref(false)
const initFailed = ref(false)
const fetchCallbacks = []

const { isAuthenticated } = useAuthentication()

watch(isAuthenticated, value => {
  if (value) {
    Promise.all(
      fetchCallbacks.map(cb => cb())
    )
      .then(_ => {
        initDone.value = true
      })
      .catch(err => {
        console.log(err)
        initFailed.value = true
      })
  }
})

export default function useLoader (name) {
  function setLoading () {
    if (!name || loading.has(name)) {
      console.log("Use useLoader('Unique name') if using setLoading", name)
    } else {
      console.log('Loading', name)
    }
    loading.add(name)
  }

  function setLoaded () {
    if (name) {
      loading.delete(name)
      console.log('Loaded', name)
    }
    if (loading.size === 0) {
      initDone.value = true
    }
  }

  function setLoadingFailed () {
    console.log(`Loading ${name} failed`)
    initFailed.value = true
  }

  function fetch (cb) {
    // Queue if not initialized. Need to check that...
    if (isAuthenticated.value) {
      cb()
    } else {
      fetchCallbacks.push(cb)
    }
  }

  return {
    initDone,
    initFailed,
    setLoading,
    setLoaded,
    setLoadingFailed,
    fetch
  }
}
