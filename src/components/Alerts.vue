<template>
  <div id="alerts">
    <v-alert
      elevation="4"
      v-for="(alert, index) in alerts"
      :key="index"
      v-model="alert.active"
      :type="alert.level"
      closable
      class="mb-2"
    >
      <div>
        <strong v-if="alert.title">{{ alert.title }}:</strong>
        {{ alert.text }}
      </div>
    </v-alert>
    <v-btn
      color="secondary"
      prepend-icon="mdi-notification-clear-all"
      class="dismiss-all"
      v-if="hasMultipleActive"
      @click="dismiss()"
    >
      {{ t('dismissAll') }}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import { clearAlertsEvent, openAlertEvent } from '@/utils/events'
import { Alert, AlertLevel } from '@/composables/types'

const AUTO_DISMISS_DELAY = 5000 // Auto dismiss in ms
const DEFAULTS = {
  sticky: false,
  level: AlertLevel.Info,
  active: true
}

const { t } = useI18n()
const alerts = reactive<Alert[]>([])

const hasMultipleActive = computed(
  () => alerts.filter((a) => a.active).length > 1
)

function dismiss(alert?: Alert) {
  if (!alert) {
    alerts.length = 0
    return
  }

  const index = alerts.indexOf(alert)
  if (index === -1) return
  alerts.splice(index, 1)
}

function textToAlert(text: string): Alert {
  switch (text.charAt(0)) {
    case '*':
      return {
        level: AlertLevel.Warning,
        text: text.slice(1),
        title: AlertLevel.Warning
      }
    case '^':
      return {
        level: AlertLevel.Error,
        sticky: true,
        text: text.slice(1),
        title: AlertLevel.Error
      }
  }
  return {
    level: AlertLevel.Info,
    text,
    title: AlertLevel.Info
  }
}

function open(data: string | Alert) {
  if (typeof data === 'string') data = textToAlert(data)
  alerts.push({ ...DEFAULTS, ...data })
  const alert = alerts.at(-1)!
  if (!alert.sticky) {
    setTimeout(() => dismiss(alert), AUTO_DISMISS_DELAY)
  }
}

onBeforeMount(() => {
  openAlertEvent.on(open)
  clearAlertsEvent.on(() => dismiss())
})
</script>

<style lang="sass">
#alerts
  z-index: 100
  position: fixed
  bottom: 1.5rem
  right: 1.5rem
  width: calc(100% - 3rem)
  max-width: 600px

  .dismiss-all
    float: right
</style>
