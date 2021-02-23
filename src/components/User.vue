<template>
  <span>
    {{ user.full_name }}
  </span>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

import useMeeting from '../composables/meeting/useMeeting'

export default defineComponent({
  name: 'User',
  props: {
    pk: {
      type: Number,
      required: true
    }
  },
  setup (props) {
    const { getUser } = useMeeting()
    const user = computed(() => getUser(props.pk))
    return {
      user
    }
  }
})
</script>
