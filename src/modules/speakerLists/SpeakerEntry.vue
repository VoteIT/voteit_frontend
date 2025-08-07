<script setup lang="ts">
import { computed } from 'vue'
import UserAvatar from '@/components/UserAvatar.vue'
import User from '@/components/User.vue'

import useMeetingGroups from '../meetings/useMeetingGroups'
import useMeetingId from '../meetings/useMeetingId'

import useGenderTag from './genderTags/useGenderTag'
import { getGenderIcon, translateGender } from './genderTags/utils'

const props = defineProps<{
  active?: boolean
  user: number
}>()

const meetingId = useMeetingId()
const { meetingGroups } = useMeetingGroups(meetingId)
const genderTag = useGenderTag(meetingId, props.user)

const subtitle = computed(() => {
  const userGroups = meetingGroups.value
    .filter((g) => g.show_on_speaker && g.members.includes(props.user))
    .map((g) => g.title)
  return userGroups.length ? userGroups.join(', ') : undefined
})
</script>

<template>
  <v-list-item color="primary" rounded :class="{ active }">
    <template #prepend>
      <UserAvatar :pk="user" />
    </template>
    <template v-if="$slots.append" #append>
      <slot name="append"></slot>
    </template>
    <v-list-item-title class="d-flex ga-1">
      <User :pk="user" />
      <v-spacer />
      <v-icon v-if="active" icon="mdi-account-voice" size="small" />
    </v-list-item-title>
    <v-list-item-subtitle v-if="subtitle">
      <v-icon icon="mdi-account-multiple" size="small" />
      {{ subtitle }}
    </v-list-item-subtitle>
    <v-list-item-subtitle v-if="genderTag">
      <v-icon :icon="getGenderIcon(genderTag)" size="small" />
      {{ translateGender($t, genderTag) }}
    </v-list-item-subtitle>
  </v-list-item>
</template>

<style scoped lang="sass">
.active
  border: 2px solid rgba(var(--v-theme-primary), .5)
</style>
