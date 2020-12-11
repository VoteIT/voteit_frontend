<template>
  <div :class="{ isAuthenticated, online: socketState }" id="socket-info">
    <span v-if="socketState">Connected</span>
    <span v-else-if="failedInitialization">Couldn't establish websocket connection. <button @click="initialize">Try again</button></span>
    <span v-else>Trying to reconnect in {{ reconnectTime }} second{{ reconnectTime === 1 ? '' : 's' }}</span>
  </div>
</template>

<script>
import { mapGetters, mapMutations, mapState } from 'vuex'

export default {
  data () {
    return {
      reconnectTime: 1,
      reconnectTries: 1,
      reconnectIntervalId: null,
      failedInitialization: false
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated']),
    ...mapState(['authToken', 'socketState'])
  },
  watch: {
    socketState (value, oldValue) {
      if (oldValue && !value) {
        this.reconnectTicker()
      }
    }
  },
  methods: {
    ...mapMutations(['setSocketState']),
    reconnectTicker (on = true) {
      if (!on) {
        clearInterval(this.reconnectIntervalId)
        this.reconnectIntervalId = null
        return
      }
      if (!this.reconnectIntervalId) {
        this.reconnectIntervalId = setInterval(this.reconnectTicker, 1000)
      }
      if (this.reconnectTime-- <= 1) {
        this.$socket.connect(this.authToken)
          .then(() => {
            // Reset tries and stop ticker
            this.reconnectTries = 1
            this.reconnectTicker(false)
          })
          .catch(() => {
            this.reconnectTime = this.reconnectTries++ ** 2
          })
      }
    },
    initialize () {
      return this.$socket.connect(this.authToken)
        .catch(() => { this.failedInitialization = true })
    }
  },
  created () {
    this.$socket.addEventListener('open', _ => {
      this.setSocketState(true)
    })
    this.$socket.addEventListener('close', _ => {
      this.setSocketState(false)
    })
    // Don't try to reconnect if not on display
    document.addEventListener('visibilitychange', () => {
      if (!this.socketState) {
        this.reconnectTicker(document.visibilityState === 'visible')
      }
    })
  }
}
</script>

<style lang="sass">
#socket-info
  position: fixed
  background-color: #000
  color: #fff
  top: 0
  left: 0
  right: 0
  padding: 8px
  transition: top 1s ease-in
  &.online,
  &:not(.isAuthenticated)
    top: -36px
    background-color: #4b4
</style>
