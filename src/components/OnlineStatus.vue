<template>
  <div
    v-if="isAuthenticated"
    :class="{ visible, dismissed }"
    id="socket-info"
    class="d-flex align-center"
    v-element-hover="onHover"
  >
    <span class="mx-4">{{ displayText }}</span>
    <v-progress-circular v-if="isConnecting" size="small" indeterminate />
    <v-btn v-if="retryBtn" v-bind="retryBtn">
      {{ t('tryAgain') }}
    </v-btn>
    <v-spacer />
    <v-btn
      class="mr-2"
      icon="mdi-chevron-up"
      size="small"
      variant="text"
      @click="dismissed = true"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { vElementHover } from '@vueuse/components'

import useAuthentication from '@/composables/useAuthentication'
import { socket, socketState } from '@/utils/Socket'
import { useI18n } from 'vue-i18n'
import { useOnline } from '@vueuse/core'
import { ThemeColor } from '@/utils/types'

const MAX_RETRIES = 5

const { t } = useI18n()
const isOnline = useOnline()

const { isAuthenticated } = useAuthentication()

const reconnectTime = ref(1)
const reconnectTries = ref(1)
const connectionFailed = ref(false)

let reconnectIntervalId: ReturnType<typeof setInterval>

function reconnectTicker() {
  reconnectTime.value--
  if (reconnectTime.value < 1) {
    clearInterval(reconnectIntervalId)
    socket.connect()
  }
}

function startTicker() {
  clearInterval(reconnectIntervalId)
  reconnectIntervalId = setInterval(reconnectTicker, 1000)
}

watch(socketState, (state) => {
  if (!isAuthenticated.value) return // Socket should be closed if this is the case, handled below
  switch (state) {
    case WebSocket.OPEN:
      // Reset reconnection values
      reconnectTime.value = 1
      reconnectTries.value = 1
      break
    case WebSocket.CLOSED:
      // Turned to closed while authenticated, try again
      if (reconnectTries.value > MAX_RETRIES) {
        connectionFailed.value = true
      } else {
        reconnectTime.value = 2 ** reconnectTries.value++
        startTicker()
      }
      break
  }
})

watch(isAuthenticated, async (value) => {
  if (value) socket.connect()
  else socket.close()
})

// eslint-disable-next-line vue/return-in-computed-property
const displayText = computed(() => {
  if (!isOnline.value) return t('network.none')
  if (!isAuthenticated.value) return
  if (socketState.value === WebSocket.OPEN) return t('network.connected')
  if (connectionFailed.value) return t('network.noConnection')
  if (
    ([WebSocket.CLOSED, WebSocket.CLOSING] as number[]).includes(
      socketState.value!
    )
  )
    return t(
      'network.reconnecting',
      { s: reconnectTime.value },
      reconnectTime.value
    )
  if (socketState.value === WebSocket.CONNECTING) return t('network.connecting')
})

const isConnecting = computed(() => socketState.value === WebSocket.CONNECTING)
const visible = computed(
  () =>
    !isOnline.value ||
    (isAuthenticated.value && socketState.value !== WebSocket.OPEN)
)
const dismissed = ref(false)
const canHover = ref(false)
function onHover() {
  if (canHover.value) dismissed.value = false
}
watch(dismissed, (value) => {
  if (value)
    setTimeout(() => {
      canHover.value = true
    }, 500)
  else canHover.value = false
})

const retryBtn = computed(() => {
  if (!connectionFailed.value) return
  return {
    prependIcon: 'mdi-reload',
    onClick: () => {
      connectionFailed.value = false
      socket.connect()
    },
    color: ThemeColor.Accent
  }
})
</script>

<style lang="sass">
#socket-info
  z-index: 1010
  position: fixed
  top: -64px
  left: 0
  right: 0
  height: 64px
  background-color: #000
  color: rgb(var(--v-theme-on-error))
  transition: top 500ms ease-in, background-color 250ms
  &.visible
    top: 0
    background-color: rgb(var(--v-theme-error))
    &.dismissed
      top: -58px
      background-color: rgb(var(--v-theme-error))
</style>
