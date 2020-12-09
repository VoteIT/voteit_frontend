import { mapGetters, mapMutations } from 'vuex'

export default {
  computed: {
    ...mapGetters(['isAuthenticated'])
  },
  methods: {
    initialize () {},
    logout () {},
    callInitialize () {
      const promise = this.initialize()
      // If Promise returned, set loaded after.
      if (promise && typeof promise.then === 'function') {
        this.setLoading(this.name)
        promise.then(_ => {
          this.setLoaded(this.name)
        })
      }
    },
    ...mapMutations(['setLoading', 'setLoaded'])
  },
  watch: {
    isAuthenticated (value) {
      if (value) {
        this.callInitialize()
      } else {
        this.logout()
      }
    }
  },
  created () {
    if (this.isAuthenticated) {
      this.callInitialize()
    }
  }
}
