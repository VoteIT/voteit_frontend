<template>
  <span>
    {{ user.full_name }}
    <small v-if="userid && user.userid" class="text-secondary">
      ({{ user.userid }})
    </small>
  </span>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

import useMeeting from '../modules/meetings/useMeeting'

export default defineComponent({
  props: {
    pk: {
      type: Number,
      required: true
    },
    userid: {
      type: Boolean,
      default: true
    }
  },
  setup (props) {
    const { getUser } = useMeeting()
    const user = computed(() => getUser(props.pk) || {})
    return {
      user
    }
  }
})
</script>
