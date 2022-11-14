<template>
  <span :class="{ time: !ordinary }">{{ prepend }} {{ fromNow }}</span>
</template>

<script lang="ts">
import moment from 'moment'
import { AxiosResponse } from 'axios'
import { ref, defineComponent, PropType } from 'vue'
import { useIntervalFn } from '@vueuse/shared'

import restApi from '@/utils/restApi'
import { durationToString } from '@/utils'

const ABSOLUTE_BREAKPOINT = moment.duration(6, 'days').asMilliseconds() // After 6 days, display absolute time
let serverAhead = 0 // In ms
let interceptorId: number | null = null

function interceptTime (response: AxiosResponse): AxiosResponse {
  if (response.headers.date) {
    serverAhead = new Date(response.headers.date).getTime() - new Date().getTime()
    if (serverAhead !== 0) console.log(`Server is ${Math.abs(serverAhead)} ms ${serverAhead > 0 ? 'ahead of' : 'behind'} you`)
    if (typeof interceptorId === 'number') restApi.interceptors.response.eject(interceptorId)
  }
  return response
}
interceptorId = restApi.interceptors.response.use(interceptTime)

export default defineComponent({
  name: 'Moment',
  props: {
    date: {
      type: Date as PropType<Date>,
      required: true
    },
    ordinary: Boolean,
    prepend: String,
    inSeconds: Boolean
  },
  setup (props) {
    const fromNow = ref('')

    // Adjust serverAhead value if we got a date in the future.
    function adjustServerAhead () {
      const date = moment(props.date)
      const msAhead = date.diff(moment())
      if (msAhead > serverAhead) {
        console.log(`Adjusting serverAhead to ${msAhead} ms ahead`)
        serverAhead = msAhead
      }
    }

    function updateFromNow () {
      // Can not be computed(), because time is not reactive
      const date = moment(props.date)
      const serverDate = moment().add(serverAhead, 'ms')
      const serverDiff = serverDate.diff(date)
      if (props.inSeconds) {
        fromNow.value = durationToString(moment.duration(serverDiff))
      } else {
        fromNow.value = serverDiff > ABSOLUTE_BREAKPOINT
          ? date.calendar()
          : date.from(serverDate)
      }
    }

    adjustServerAhead()
    useIntervalFn(updateFromNow, props.inSeconds ? 1_000 : 60_000, { immediateCallback: true })

    return {
      fromNow
    }
  }
})
</script>

<style lang="sass">
span.time
  font-size: 12px
  color: var(--disabled-text)
</style>
