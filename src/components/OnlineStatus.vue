<template>
  <div :class="{ online: socketState }" id="socket-info">
    <span v-if="socketState">Connected</span>
    <span v-else>Trying to reconnect in {{ reconnectTime }} second{{ reconnectTime === 1 ? '' : 's' }}</span>
  </div>
</template>

<script>
export default {
  data () {
    return {
      reconnectTime: 1,
      reconnectTries: 1,
      reconnectIntervalId: null
    }
  },
  computed: {
    socketState: {
      set (value) {
        if (value) {
          this.$root.$emit('socket-open', this.$socket)
        } else if (this.$store.state.socketState) {
          // Only on state change
          this.reconnectTicker()
        }
        this.$store.commit('setSocketState', value)
      },
      get () {
        return this.$store.state.socketState
      }
    }
  },
  methods: {
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
        this.$socket.connect()
          .then(() => {
            // Reset tries and stop ticker
            this.reconnectTries = 1
            this.reconnectTicker(false)
          })
          .catch(() => {
            this.reconnectTime = this.reconnectTries++ ** 2
          })
      }
    }
  },
  created () {
    this.$socket.addEventListener('open', () => {
      this.socketState = true
    })
    this.$socket.addEventListener('close', () => {
      this.socketState = false
    })
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
  &.online
    top: -36px
    background-color: #4b4
</style>
