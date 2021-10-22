<template>
  <div v-if="isAuthenticated" :class="{ disconnected }" id="socket-info">
    <span>{{ displayText }}</span>
    <v-progress-circular v-if="connecting" size="small" indeterminate />
    <v-btn v-if="retryBtn" v-bind="retryBtn">
      {{ t('tryAgain') }}
    </v-btn>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, ref, watch } from 'vue'

import useAuthentication from '@/composables/useAuthentication'
import Channel from '@/contentTypes/Channel'
import { useI18n } from 'vue-i18n'
import { ThemeColor } from '@/utils/types'

const MAX_RETRIES = 5

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const reconnectTime = ref(1)
    const reconnectTries = ref(1)
    const failedInitialization = ref(false)
    const { isAuthenticated } = useAuthentication()
    const { connect, socketState } = new Channel()

    let reconnectIntervalId: number

    async function reconnect () {
      clearInterval(reconnectIntervalId)
      try {
        await connect()
        reconnectTries.value = 1
      } catch {
        if (reconnectTries.value > MAX_RETRIES) {
          failedInitialization.value = true
          return
        }
        // Double reconnect timeout with every try
        reconnectTime.value = 2 ** reconnectTries.value++
        startTicker()
      }
    }

    function reconnectTicker () {
      reconnectTime.value--
      if (reconnectTime.value < 1) reconnect()
    }

    function startTicker () {
      clearInterval(reconnectIntervalId)
      reconnectIntervalId = setInterval(reconnectTicker, 1000)
    }

    watch(isAuthenticated, async (value) => {
      if (!value) return
      try {
        await connect()
      } catch {
        failedInitialization.value = true
      }
    })

    watch(socketState, (value, oldValue) => {
      if (oldValue && !value) startTicker()
    })

    onBeforeMount(() => {
      document.addEventListener('visibilitychange', () => {
        if (!socketState.value && document.visibilityState === 'visible') startTicker()
      })
    })

    const displayText = computed(() => {
      if (socketState.value) return t('socket.connected')
      if (failedInitialization.value) return t('socket.reconnectingFailed')
      return t('socket.reconnecting', { s: reconnectTime.value }, reconnectTime.value)
    })

    const disconnected = computed(() => !socketState.value)
    const connecting = computed(() => disconnected.value && !failedInitialization.value && reconnectTime.value < 1)

    const retryBtn = computed(() => {
      if (!failedInitialization.value) return
      return {
        prependIcon: 'mdi-reload',
        onClick: () => {
          failedInitialization.value = false
          connect()
            .catch(() => { failedInitialization.value = true })
        },
        color: ThemeColor.Accent
      }
    })

    return {
      t,
      disconnected,
      displayText,
      isAuthenticated,
      retryBtn,
      connecting
    }
  }
})
</script>

<style lang="sass">
#socket-info
  z-index: 5
  position: fixed
  top: -64px
  left: 0
  right: 0
  height: 64px
  background-color: #000
  color: rgb(var(--v-theme-on-error))
  transition: top 1s ease-in, background-color 250ms
  display: flex
  justify-content: flex-start
  align-items: center
  span
    margin: 0 2em
  &.disconnected
    top: 0
    background-color: rgb(var(--v-theme-error))
</style>
