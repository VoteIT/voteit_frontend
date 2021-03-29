<template>
  <v-avatar :size="size" color="primary">
    {{ initials }}
  </v-avatar>
</template>

<script lang="ts">
/* eslint-disable camelcase */
import { computed, defineComponent } from 'vue'

import useMeeting from '../composables/meeting/useMeeting'

export default defineComponent({
  name: 'User',
  props: {
    pk: Number,
    size: String
  },
  setup (props) {
    const { getUser } = useMeeting()
    const user = computed(() => getUser(props.pk))

    const initials = computed(() => {
      if (!user.value) return '?'
      const { first_name, last_name } = user.value
      if (first_name && !last_name) return first_name.slice(0, 2).toUpperCase()
      if (last_name && !first_name) return last_name.slice(0, 2).toUpperCase()
      return (first_name[0] + last_name[0]).toUpperCase()
    })

    return {
      initials
    }
  }
})
</script>
