import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState(['isAuthenticated'])
  },
  methods: {
    initialize () {},
    logout () {}
  },
  watch: {
    isAuthenticated (value) {
      if (value) {
        this.initialize()
      } else {
        this.logout()
      }
    }
  },
  created () {
    if (this.isAuthenticated) {
      this.initialize()
    }
  }
}
