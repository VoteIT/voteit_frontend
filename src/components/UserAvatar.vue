<template>
  <UserPopup v-if="popup && computedUser" :user="computedUser">
    <template #activator="{ props }">
      <v-avatar
        v-bind="{ ...$attrs, ...props }"
        :size="size"
        :color="bg"
        :image="image"
        class="activator"
      >
        {{ initials }}
      </v-avatar>
    </template>
  </UserPopup>
  <v-avatar v-else :size="size" :color="bg" :image="image">
    {{ initials }}
  </v-avatar>
</template>

<script setup lang="ts">
/* eslint-disable camelcase */
import { computed } from 'vue'

import useAuthentication from '@/composables/useAuthentication'
import useUserDetails from '@/modules/organisations/useUserDetails'
import type { User } from '@/modules/organisations/types'
import { ThemeColor } from '@/utils/types'

import UserPopup from './UserPopup.vue'

const props = withDefaults(
  defineProps<{
    color?: string
    popup?: boolean
    pk?: number
    size?: string
    user?: User
  }>(),
  {
    color: 'primary'
  }
)

const { getUser } = useUserDetails()
const auth = useAuthentication()
const computedUser = computed(
  () => props.user ?? (props.pk ? getUser(props.pk) : auth.user.value)
)

const initials = computed(() => {
  if (image.value) return
  if (!computedUser.value) return '?'
  const { first_name, last_name } = computedUser.value
  if (first_name && !last_name) return first_name.slice(0, 2).toUpperCase()
  if (!first_name && last_name) return last_name.slice(0, 2).toUpperCase()
  if (!first_name && !last_name) return '?'
  return (first_name[0] + last_name[0]).toUpperCase()
})

const bg = computed(() => {
  if (!computedUser.value) return ThemeColor.Secondary
  if (image.value) return
  return props.color
})

const image = computed(() => {
  if (!computedUser.value) return
  return computedUser.value.img_url ?? undefined // Change null to undefined
})
</script>

<style lang="sass" scoped>
.activator
  cursor: pointer
</style>
