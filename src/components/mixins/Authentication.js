// import { mapGetters, mapMutations } from 'vuex'
import useAuthentication from '@/composables/useAuthentication'
import { emitter } from '../../utils'
// import useLoader from '@/composables/useLoader.js'

export default {
  methods: {
    initialize () {},
    callInitialize () {
      const promise = this.initialize()
      // If Promise returned, set loaded after.
      if (promise && typeof promise.then === 'function') {
        this.setLoading()
        promise
          .then(_ => {
            this.setLoaded()
          })
          .catch(_ => {
            this.setLoadingFailed()
          })
      }
    }
  },
  created () {
    const { isAuthenticated } = useAuthentication()
    emitter.on('authenticated', value => {
      if (value) {
        this.callInitialize()
      }
    })
    if (isAuthenticated.value) {
      this.callInitialize()
    }
  }
}
