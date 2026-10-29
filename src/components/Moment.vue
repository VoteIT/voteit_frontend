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
import { Duration, DateTime } from 'luxon'
import { computed, ref, watchEffect } from 'vue'
import { useIntervalFn } from '@vueuse/shared'

import { durationToString } from '@/utils'
import { currentLocale } from '@/utils/locales'
import useServerDateTime from '@/composables/useServerDateTime'

const ABSOLUTE_BREAKPOINT = Duration.fromObject({ days: 6 }) // After 6 days, display absolute time

const props = defineProps<{
  date: string
  ordinary?: boolean
  prepend?: string
  inSeconds?: boolean
}>()

const { dateTime, serverNow } = useServerDateTime(computed(() => props.date))
const fromNow = ref('')

const exactDate = computed(() =>
  DateTime.fromISO(props.date).toLocaleString(
    { dateStyle: 'long', timeStyle: 'long' },
    { locale: currentLocale.value }
  )
)

function updateFromNow() {
  // Can not be computed(), because time is not reactive
  const serverDateTime = serverNow()
  const serverDiff = serverDateTime.diff(dateTime.value)
  if (props.inSeconds) {
    fromNow.value = durationToString(serverDiff)
  } else {
    // DateTime objects keep the locale they were created with, so set it explicitly
    const localized = dateTime.value.setLocale(currentLocale.value)
    fromNow.value =
      serverDiff > ABSOLUTE_BREAKPOINT
        ? localized.toLocaleString()
        : localized.toRelative({ base: serverDateTime }) || ''
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
