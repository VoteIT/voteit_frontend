<template>
  <UserPopup v-if="user" :user="user">
    <template #activator="{ props }">
      <span v-bind="props" class="activator">
        {{ getFullName(user) }}
        <small v-if="userid && user.userid" class="text-secondary">
          ({{ user.userid }})
        </small>
      </span>
    </template>
  </UserPopup>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { getFullName } from '@/utils'
import useUserDetails from '../modules/organisations/useUserDetails'

import UserPopup from './UserPopup.vue'

const props = defineProps<{
  pk: number,
  userid?: boolean
}>()

const { getUser } = useUserDetails()
const user = computed(() => getUser(props.pk))
</script>

<style lang="sass" scoped>
.activator
  cursor: pointer
</style>
