<template>
  <UserPopup v-if="popup" :user="computedUser">
    <template #activator="{ props }">
      <v-avatar v-bind="{ ...$attrs, ...props }" :size="size" :color="bg" :image="image" class="activator">
        {{ initials }}
      </v-avatar>
    </template>
  </UserPopup>
  <v-avatar v-else :size="size" :color="bg" :image="image">
    {{ initials }}
  </v-avatar>
</template>

<script lang="ts">
/* eslint-disable camelcase */
import { computed, defineComponent, PropType } from 'vue'

import useAuthentication from '@/composables/useAuthentication'
import useUserDetails from '@/modules/organisations/useUserDetails'
import type { User } from '@/modules/organisations/types'
import { ThemeColor } from '@/utils/types'

import UserPopup from './UserPopup.vue'

export default defineComponent({
  name: 'User',
  components: {
    UserPopup
  },
  props: {
    color: {
      type: String,
      default: 'primary'
    },
    popup: Boolean,
    pk: Number,
    size: String,
    user: Object as PropType<User>
  },
  setup (props) {
    const { getUser } = useUserDetails()
    const auth = useAuthentication()
    const user = computed(() => props.user ?? (props.pk ? getUser(props.pk) : auth.user.value))

    const initials = computed(() => {
      if (image.value) return
      if (!user.value) return '?'
      const { first_name, last_name } = user.value
      if (first_name && !last_name) return first_name.slice(0, 2).toUpperCase()
      if (!first_name && last_name) return last_name.slice(0, 2).toUpperCase()
      if (!first_name && !last_name) return '?'
      return (first_name[0] + last_name[0]).toUpperCase()
    })

    const bg = computed(() => {
      if (!user.value) return ThemeColor.Secondary
      if (image.value) return
      return props.color
    })

    const image = computed(() => {
      if (!user.value) return
      return user.value.img_url ?? undefined // Change null to undefined
    })

    return {
      bg,
      computedUser: user,
      initials,
      image
    }
  }
})
</script>

<style lang="sass" scoped>
.activator
  cursor: pointer
</style>
