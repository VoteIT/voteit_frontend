<template>
  <span>
    {{ user.full_name }}
  </span>
</template>

<script>
import { computed } from 'vue'
import useMeeting from '../composables/meeting/useMeeting'

export default {
  name: 'User',
  props: {
    pk: Number
  },
  setup (props) {
    const { getUser } = useMeeting()
    const user = computed(_ => {
      return getUser(props.pk)
    })
    return {
      user
    }
  }
}
</script>
