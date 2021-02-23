<template>
  <div id="alerts">
    <div class="alert" :class="alert.level" v-for="(alert, index) in alerts" :key="index">
      <icon sm name="close" class="close" @click="dismiss(alert)" />
      <span v-if="alert.html" v-html="alert.html" />
      <span v-else>
        <strong v-if="alert.title">{{ alert.title }}:</strong>
        {{ alert.text }}
      </span>
    </div>
    <button class="dismiss-all" v-if="alerts.length > 1" @click="dismiss()"><icon sm name="clear_all" />Dismiss all</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount, reactive } from 'vue'

import { emitter } from '@/utils'
import { Alert } from '@/composables/types'

const AUTO_DISMISS_DELAY = 5000 // Auto dismiss in ms
const Level = {
  info: 'info',
  warning: 'warning',
  error: 'error'
}
const DEFAULTS = {
  sticky: false,
  level: Level.info
}

export default defineComponent({
  name: 'Alerts',
  setup () {
    const alerts = reactive<Alert[]>([])

    function dismiss (alert?: Alert) {
      if (alert) {
        const index = alerts.indexOf(alert)
        if (index !== -1) {
          alerts.splice(index, 1)
        }
      } else {
        alerts.length = 0
      }
    }

    function textToAlert (text: string): Alert {
      let level = DEFAULTS.level
      let sticky = false
      switch (text.charAt(0)) {
        case '*':
          text = text.substr(1)
          level = Level.warning
          break
        case '^':
          text = text.substr(1)
          level = Level.error
          sticky = true
          break
      }
      return {
        text,
        level,
        title: level,
        sticky
      }
    }

    function open (data: string | Alert) {
      if (typeof data === 'string') {
        alerts.push({ ...DEFAULTS, ...textToAlert(data) })
      } else {
        alerts.push({ ...DEFAULTS, ...data })
      }
      const alert = alerts[alerts.length - 1]
      if (!alert.sticky) {
        setTimeout(() => dismiss(alert), AUTO_DISMISS_DELAY)
      }
    }

    onBeforeMount(() => {
      emitter.on('alert-open', (alert) => open(alert as string | Alert))
    })

    return {
      alerts,
      dismiss
    }
  }
})
</script>

<style lang="sass">
#alerts
  position: fixed
  bottom: 1.5rem
  right: 1.5rem
  width: calc(100% - 3rem)
  max-width: 600px

  .alert
    margin-top: 1rem
    background-color: #ddd
    padding: 1rem
    border-radius: 5px
    box-shadow: 1px 1px 3px rgba(#000, .3)

    &.info
      background-color: #ddf
    &.error
      background-color: #e8d3d3
    &.warning
      background-color: #ffd

  .close
    float: right
    cursor: pointer
    position: relative
    top: -.4rem
    left: .4rem
    opacity: .5
    &:hover
      opacity: 1

  .dismiss-all
    float: right
    margin-top: 1rem
</style>
