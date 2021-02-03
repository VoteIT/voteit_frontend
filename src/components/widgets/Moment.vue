<template>
  <span class="time">{{ fromNow }}</span>
</template>

<script>
import { onBeforeUnmount, onBeforeMount, ref } from 'vue'
import moment from 'moment'

export default {
  name: 'Moment',
  props: {
    date: Date
  },
  setup (props) {
    let intervalId
    const fromNow = ref('')

    function updateFromNow () {
      fromNow.value = moment(props.date).fromNow()
    }

    onBeforeMount(_ => {
      updateFromNow()
      intervalId = setInterval(updateFromNow, 60000)
    })

    onBeforeUnmount(_ => {
      clearInterval(intervalId)
    })

    return {
      fromNow
    }
  }
}
</script>

<style lang="sass">
span.time
  font-size: 12px
  color: #666
</style>
