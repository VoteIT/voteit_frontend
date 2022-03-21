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

import useUserDetails from '../modules/organisations/useUserDetails'

export default defineComponent({
  props: {
    pk: {
      type: Number,
      required: true
    },
    userid: Boolean
  },
  setup (props) {
    const { getUser } = useUserDetails()
    const user = computed(() => getUser(props.pk) || {})
    return {
      user
    }
  }
})
</script>
