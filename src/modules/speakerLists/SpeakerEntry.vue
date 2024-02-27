<script setup lang="ts">
import { computed } from 'vue'
import UserAvatar from '@/components/UserAvatar.vue'
import User from '@/components/User.vue'

import useMeetingGroups from '../meetings/useMeetingGroups'
import useMeetingId from '../meetings/useMeetingId'

const { meetingGroups } = useMeetingGroups(useMeetingId())

const props = defineProps<{
  active?: boolean
  user: number
}>()

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
    <v-list-item-title>
      <User :pk="user" />
      <v-icon
        v-if="active"
        icon="mdi-account-voice"
        size="x-small"
        class="ml-1"
      />
    </v-list-item-title>
    <v-list-item-subtitle>
      {{ subtitle }}
    </v-list-item-subtitle>
  </v-list-item>
</template>

<style scoped lang="sass">
.active
  border: 2px solid rgba(var(--v-theme-primary), .5)
</style>
