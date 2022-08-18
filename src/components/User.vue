<template>
  <UserPopup :user="user">
    <template #activator="{ props }">
      <span v-bind="props" class="activator">
        {{ user.full_name }}
        <small v-if="userid && user.userid" class="text-secondary">
          ({{ user.userid }})
        </small>
      </span>
    </template>
  </UserPopup>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

import useUserDetails from '../modules/organisations/useUserDetails'
import UserPopup from './UserPopup.vue'

export default defineComponent({
  components: { UserPopup },
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

<style lang="sass" scoped>
.activator
  cursor: pointer
</style>
