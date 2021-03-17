<template>
  <span :class="{ time: !ordinary }">{{ prepend }} {{ fromNow }}</span>
</template>

<script lang="ts">
import { onBeforeUnmount, onBeforeMount, ref, defineComponent, PropType } from 'vue'
import moment from 'moment'

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
      if (props.inSeconds) {
        const duration = moment.duration(new Date().getTime() - props.date.getTime())
        if (duration.hours()) {
          fromNow.value = `${duration.hours()}:${digits(duration.minutes())}:${digits(duration.seconds())}`
        } else {
          fromNow.value = `${duration.minutes()}:${digits(duration.seconds())}`
        }
      } else {
        fromNow.value = moment(props.date).fromNow()
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
