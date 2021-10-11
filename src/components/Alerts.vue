<template>
  <div id="alerts">
    <v-alert elevation="4" v-for="(alert, index) in alerts" :key="index" v-model="alert.active" :type="alert.level" closable class="mb-2">
      <div>
        <strong v-if="alert.title">{{ alert.title }}:</strong>
        {{ alert.text }}
      </div>
    </v-alert>
    <v-btn color="secondary" prepend-icon="mdi-notification-clear-all" class="dismiss-all" v-if="hasMultipleActive" @click="dismiss()">
      {{ t('dismissAll') }}
    </v-btn>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, reactive } from 'vue'

import { openAlertEvent } from '@/utils'

import { Alert, AlertLevel } from '@/composables/types'
import { useI18n } from 'vue-i18n'

const AUTO_DISMISS_DELAY = 5000 // Auto dismiss in ms
const DEFAULTS = {
  sticky: false,
  level: AlertLevel.Info,
  active: true
}

export default defineComponent({
  name: 'Alerts',
  setup () {
    const { t } = useI18n()
    const alerts = reactive<Alert[]>([])

    const hasMultipleActive = computed(() => alerts.filter(a => a.active).length > 1)

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
          level = AlertLevel.Warning
          break
        case '^':
          text = text.substr(1)
          level = AlertLevel.Error
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
      openAlertEvent.on(open)
    })

    return {
      t,
      alerts,
      hasMultipleActive,
      dismiss
    }
  }
})
</script>

<style lang="sass">
#alerts
  z-index: 1000
  position: fixed
  bottom: 1.5rem
  right: 1.5rem
  width: calc(100% - 3rem)
  max-width: 600px

  .dismiss-all
    float: right
</style>
