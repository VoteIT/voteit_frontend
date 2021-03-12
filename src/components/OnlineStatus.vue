<template>
  <div :class="{ isAuthenticated, online: socketState }" id="socket-info">
    <span v-if="socketState">{{ t('socket.connected') }}</span>
    <span v-else-if="failedInitialization">{{ t('socket.reconnectingFailed') }} <button @click="tryAgain()">{{ t('tryAgain') }}</button></span>
    <span v-else>{{ t('socket.reconnecting', {s: reconnectTime}, reconnectTime) }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount, ref, watch } from 'vue'

import useAuthentication from '@/composables/useAuthentication'
import Channel from '@/contentTypes/Channel'

const MAX_RETRIES = 5

export default defineComponent({
  inject: ['t'],
  setup () {
    const reconnectTime = ref(1)
    const reconnectTries = ref(1)
    const failedInitialization = ref(false)
    const { authToken, isAuthenticated } = useAuthentication()
    const { connect, socketState } = new Channel()

    let reconnectIntervalId: number

    function reconnectTicker (on = true) {
      // Always cancel existing interval
      clearInterval(reconnectIntervalId)
      if (on) {
        reconnectIntervalId = setInterval(reconnectTicker, 1000)
        if (reconnectTime.value < 1) {
          connect()
            .then(() => {
              // Reset tries and stop ticker
              reconnectTries.value = 1
              reconnectTicker(false)
            })
            .catch(() => {
              if (reconnectTries.value > MAX_RETRIES) {
                failedInitialization.value = true
                reconnectTicker(false)
              } else {
                // Double reconnect timeout with every try
                reconnectTime.value = 2 ** reconnectTries.value++
              }
            })
        } else {
          reconnectTime.value--
        }
      }
    }

    function tryAgain () {
      failedInitialization.value = false
      connect()
        .catch(() => {
          failedInitialization.value = true
        })
    }

    watch(authToken, value => {
      if (value) {
        connect(value)
          .catch(() => {
            failedInitialization.value = true
          })
      }
    })

    watch(socketState, (value, oldValue) => {
      if (oldValue && !value) {
        reconnectTicker()
      }
    })

    onBeforeMount(() => {
      document.addEventListener('visibilitychange', () => {
        if (!socketState.value) {
          reconnectTicker(document.visibilityState === 'visible')
        }
      })
    })

    return {
      reconnectTime,
      reconnectTries,
      failedInitialization,
      socketState,
      isAuthenticated,
      tryAgain
    }
  }
})
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
    top: -40px
    background-color: #4b4
</style>
