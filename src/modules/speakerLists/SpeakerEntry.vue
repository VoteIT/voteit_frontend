<script setup lang="ts">
import UserAvatar from '@/components/UserAvatar.vue'
import User from '@/components/User.vue'

defineProps<{
  active?: boolean
  annotations: { icon: string; text: string }[]
  user: number
}>()
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
    <v-list-item-subtitle v-for="{ icon, text } in annotations">
      <v-icon :icon="icon" size="small" />
      {{ text }}
    </v-list-item-subtitle>
  </v-list-item>
</template>

<style scoped lang="sass">
.active
  border: 2px solid rgba(var(--v-theme-primary), .5)
</style>
