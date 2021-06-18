<template>
  <span :class="{ time: !ordinary }">{{ prepend }} {{ fromNow }}</span>
</template>

<script lang="ts">
import { onBeforeUnmount, onBeforeMount, ref, defineComponent, PropType } from 'vue'
import moment from 'moment'
import { AxiosResponse } from 'axios'

import { restApi } from '@/utils'

let msServerAhead = 0
let interceptorId: number | null = null

function interceptTime (response: AxiosResponse): AxiosResponse {
  if (response.headers.date) {
    msServerAhead = new Date(response.headers.date).getTime() - new Date().getTime()
    if (interceptorId) restApi.interceptors.response.eject(interceptorId)
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

    const digits = (n: number) => n.toLocaleString(undefined, { minimumIntegerDigits: 2 })

    function updateFromNow () {
      // Can not be computed(), because it has to trigger reactivity
      const serverDate = moment().add(msServerAhead, 'ms')
      const date = moment(props.date)
      if (props.inSeconds) {
        const duration = moment.duration(serverDate.diff(date))
        if (duration.hours()) {
          fromNow.value = `${duration.hours()}:${digits(duration.minutes())}:${digits(duration.seconds())}`
        } else {
          fromNow.value = `${duration.minutes()}:${digits(duration.seconds())}`
        }
      } else {
        fromNow.value = date.from(serverDate)
      }
    }

    onBeforeMount(() => {
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
