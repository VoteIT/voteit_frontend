<template>
  <v-avatar :size="size" :color="bg" :image="image">
    {{ initials }}
  </v-avatar>
</template>

<script lang="ts">
/* eslint-disable camelcase */
import { computed, defineComponent } from 'vue'

import useAuthentication from '@/composables/useAuthentication'
import useUserDetails from '@/modules/organisations/useUserDetails'
import { ThemeColor } from '@/utils/types'

export default defineComponent({
  name: 'User',
  props: {
    pk: Number,
    size: String,
    color: {
      type: String,
      default: 'primary'
    }
  },
  setup (props) {
    const { getUser } = useUserDetails()
    const auth = useAuthentication()
    const user = computed(() => props.pk ? getUser(props.pk) : auth.user.value)

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
      initials,
      image
    }
  }
})
</script>
