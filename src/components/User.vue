<template>
  <span v-if="noPopup && user" v-bind="props">
    {{ getFullName(user) }}
    <small v-if="userid && user.userid" class="text-secondary">
      ({{ user.userid }})
    </small>
  </span>
  <UserPopup v-else-if="user" :user="user">
    <template #activator="{ props }">
      <span v-bind="props" class="cursor-pointer">
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
  noPopup?: boolean
  pk: number
  userid?: boolean
}>()

const { getUser } = useUserDetails()
const user = computed(() => getUser(props.pk))
</script>
