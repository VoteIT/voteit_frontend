<template>
  <span v-if="inSeconds" :class="{ time: !ordinary }">
    {{ prepend }} {{ fromNow }}
  </span>
  <v-tooltip v-else :text="exactDate">
    <template #activator="{ props }">
      <span v-bind="{ ...props, ...$attrs }" :class="{ time: !ordinary }">
        {{ prepend }} {{ fromNow }}
      </span>
    </template>
  </v-tooltip>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useIntervalFn } from '@vueuse/shared'
import { useI18n } from 'vue-i18n'

import { durationToString } from '@/utils'
import {
  DAY,
  DATETIME_LONG,
  SECOND,
  formatDate,
  formatRelative
} from '@/utils/dates'
import useServerDateTime from '@/composables/useServerDateTime'

const ABSOLUTE_BREAKPOINT = 6 * DAY // After 6 days, display absolute time
const JUST_NOW_THRESHOLD = 30 * SECOND // Within this, display "Just now"

const props = defineProps<{
  date: string
  ordinary?: boolean
  prepend?: string
  inSeconds?: boolean
  /**
   * The date is meant to be in the future, e.g. a deadline. Without this, a
   * future date is taken to mean the server clock is ahead of ours, which
   * shifts every relative time in the app.
   */
  future?: boolean
}>()

const { t } = useI18n()

const { dateTime, serverNow } = useServerDateTime(
  computed(() => props.date),
  !props.future
)
const fromNow = ref('')

const exactDate = computed(() => formatDate(props.date, DATETIME_LONG))

function updateFromNow() {
  // Can not be computed(), because time is not reactive
  const serverDiff = serverNow() - dateTime.value
  if (props.inSeconds) {
    fromNow.value = durationToString(serverDiff)
  } else if (Math.abs(serverDiff) <= JUST_NOW_THRESHOLD) {
    fromNow.value = t('justNow')
  } else if (serverDiff > ABSOLUTE_BREAKPOINT) {
    fromNow.value = formatDate(dateTime.value)
  } else {
    fromNow.value = formatRelative(-serverDiff)
  }
}

useIntervalFn(updateFromNow, props.inSeconds ? 1_000 : 60_000, {
  immediateCallback: true
})
watchEffect(updateFromNow)
</script>

<style lang="sass">
span.time
  font-size: 12px
  color: var(--disabled-text)
</style>
