<template>
  <span class="time">{{ fromNow }}</span>
</template>

<script lang="ts">
import { onBeforeUnmount, onBeforeMount, ref, defineComponent } from 'vue'
import moment from 'moment'

export default defineComponent({
  name: 'Moment',
  props: {
    date: {
      type: Date,
      required: true
    }
  },
  setup (props) {
    let intervalId: number
    const fromNow = ref('')

    function updateFromNow () {
      fromNow.value = moment(props.date).fromNow()
    }

    onBeforeMount(() => {
      updateFromNow()
      intervalId = setInterval(updateFromNow, 60000)
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
  color: #666
</style>
