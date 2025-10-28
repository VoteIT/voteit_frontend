<template>
  <UserPopup v-if="popup && computedUser" :user="computedUser">
    <template #activator="{ props }">
      <v-avatar
        class="cursor-pointer"
        :color="bg"
        :image="image"
        :size="size"
        :text="initials"
        v-bind="{ ...$attrs, ...props }"
      />
    </template>
  </UserPopup>
  <v-avatar v-else :color="bg" :image="image" :size="size" :text="initials" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { ThemeColor } from '@/utils/types'
import useAuthStore from '@/modules/auth/useAuthStore'
import useUserDetails from '@/modules/organisations/useUserDetails'
import type { IUser } from '@/modules/organisations/types'

import UserPopup from './UserPopup.vue'

const props = withDefaults(
  defineProps<{
    color?: string
    popup?: boolean
    pk?: number
    size?: string
    user?: IUser
  }>(),
  {
    color: 'primary'
  }
)

const authStore = useAuthStore()
const { getUser } = useUserDetails()

const computedUser = computed(
  () => props.user ?? (props.pk ? getUser(props.pk) : authStore.user)
)

const bg = computed(() => {
  if (!computedUser.value) return ThemeColor.Secondary
  if (image.value) return
  return props.color
})

const image = computed(
  () => computedUser.value?.img_url ?? undefined // Change null to undefined
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
</script>
