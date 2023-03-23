<template>
  <span :class="{ time: !ordinary }">{{ prepend }} {{ fromNow }}</span>
</template>

<script setup lang="ts">
import { DateTime, Duration } from 'luxon'
import { AxiosResponse } from 'axios'
import { nextTick, ref, watch } from 'vue'
import { useIntervalFn } from '@vueuse/shared'

import restApi from '@/utils/restApi'
import { durationToString } from '@/utils'
import { currentLocale } from '@/utils/locales'

const ABSOLUTE_BREAKPOINT = Duration.fromObject({ days: 6 }) // After 6 days, display absolute time
let serverAhead = Duration.fromMillis(0) // In ms
let interceptorId: number | null = null

function interceptTime (response: AxiosResponse): AxiosResponse {
  if (response.headers.date) {
    serverAhead = DateTime.fromISO(response.headers.date).diff(DateTime.now())
    if (serverAhead.milliseconds !== 0) console.log(`Server is ${Math.abs(serverAhead.milliseconds)} ms ${serverAhead.milliseconds > 0 ? 'ahead of' : 'behind'} you`)
    if (typeof interceptorId === 'number') restApi.interceptors.response.eject(interceptorId)
  }
  return response
}
interceptorId = restApi.interceptors.response.use(interceptTime)

interface Props {
  date: string
  ordinary?: boolean
  prepend?: string
  inSeconds?: boolean
}

const props = defineProps<Props>()

const fromNow = ref('')

// Adjust serverAhead value if we got a date in the future.
function adjustServerAhead () {
  const date = DateTime.fromISO(props.date)
  const msAhead = date.diff(DateTime.now())
  if (msAhead > serverAhead) {
    console.log(`Adjusting serverAhead to ${msAhead} ms ahead`)
    serverAhead = msAhead
  }
}

function updateFromNow () {
  // Can not be computed(), because time is not reactive
  const date = DateTime.fromISO(props.date)
  const serverDate = DateTime.now().plus(serverAhead)
  const serverDiff = serverDate.diff(date)
  if (props.inSeconds) {
    fromNow.value = durationToString(serverDiff)
  } else {
    fromNow.value = serverDiff > ABSOLUTE_BREAKPOINT
      ? date.toLocaleString()
      : date.toRelative({ base: serverDate }) || ''
  }
}

adjustServerAhead()
useIntervalFn(updateFromNow, props.inSeconds ? 1_000 : 60_000, { immediateCallback: true })
watch(() => props.date, updateFromNow)
watch(currentLocale, () => nextTick(updateFromNow))
</script>

<style lang="sass">
span.time
  font-size: 12px
  color: var(--disabled-text)
</style>
