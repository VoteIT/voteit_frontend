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

import { durationToString } from '@/utils'
import { DAY, DATETIME_LONG, formatDate, formatRelative } from '@/utils/dates'
import useServerDateTime from '@/composables/useServerDateTime'

const ABSOLUTE_BREAKPOINT = 6 * DAY // After 6 days, display absolute time

const props = defineProps<{
  date: string
  ordinary?: boolean
  prepend?: string
  inSeconds?: boolean
}>()

const { dateTime, serverNow } = useServerDateTime(computed(() => props.date))
const fromNow = ref('')

const exactDate = computed(() => formatDate(props.date, DATETIME_LONG))

function updateFromNow() {
  // Can not be computed(), because time is not reactive
  const serverDiff = serverNow() - dateTime.value
  if (props.inSeconds) {
    fromNow.value = durationToString(serverDiff)
  } else {
    fromNow.value =
      serverDiff > ABSOLUTE_BREAKPOINT
        ? formatDate(dateTime.value)
        : formatRelative(-serverDiff)
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
