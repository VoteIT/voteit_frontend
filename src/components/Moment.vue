<template>
  <span :class="{ time: !ordinary }">{{ prepend }} {{ fromNow }}</span>
</template>

<script lang="ts">
import { onBeforeUnmount, onBeforeMount, ref, defineComponent, PropType } from 'vue'
import moment from 'moment'
import { AxiosResponse } from 'axios'
import restApi from '@/utils/restApi'

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
    let intervalId: number
    const fromNow = ref('')

    function digits (n: number) {
      return n.toLocaleString(undefined, { minimumIntegerDigits: 2 })
    }

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
      // Can not be computed(), because it has to trigger reactivity
      const date = moment(props.date)
      const serverDate = moment().add(serverAhead, 'ms')
      const serverDiff = serverDate.diff(date)
      if (props.inSeconds) {
        const duration = moment.duration(serverDiff)
        fromNow.value = duration.hours()
          ? `${duration.hours()}:${digits(duration.minutes())}:${digits(duration.seconds())}`
          : `${duration.minutes()}:${digits(duration.seconds())}`
      } else {
        fromNow.value = serverDiff > ABSOLUTE_BREAKPOINT
          ? date.calendar()
          : date.from(serverDate)
      }
    }

    onBeforeMount(() => {
      adjustServerAhead()
      updateFromNow()
      intervalId = setInterval(updateFromNow, props.inSeconds ? 1000 : 60000)
    })

    onBeforeUnmount(() => {
      clearInterval(intervalId)
    })

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
