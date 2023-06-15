<template>
  <v-overlay
    scroll-strategy="close"
    location-strategy="connected" location="top center" origin="auto"
    :scrim="false"
    :transition="false"
    >
    <template #activator="{ props }">
      <slot name="activator" :props="props" />
    </template>
    <v-card rounded="lg" class="mb-1" elevation="4">
      <v-card-item>
        <UserAvatar :user="user" size="large" class="mt-1" />
        <v-card-title>
          {{ getFullName(user) }}
        </v-card-title>
        <v-card-subtitle>
          {{ user.userid }}
        </v-card-subtitle>
      </v-card-item>
      <v-card-text v-if="user.email">
        <a :href="`mailto:${user.email}`">
          {{ user.email }}
        </a>
      </v-card-text>
    </v-card>
  </v-overlay>
</template>

<script setup lang="ts">
import { getFullName } from '@/utils'
import { User } from '@/modules/organisations/types'

defineProps<{
  user: User
}>()
</script>
