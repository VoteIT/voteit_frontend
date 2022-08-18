<template>
  <v-overlay
    scroll-strategy="close"
    location-strategy="connected" location="top center" origin="auto"
    :scrim="false"
    :transition="false"
    >
    <template #activator="{ props }">
      <slot name="activator" :props="props" class="activator" />
    </template>
    <v-card rounded="lg" class="mb-1" elevation="4">
      <v-card-item>
        <UserAvatar :user="user" size="large" class="mt-1" />
        <v-card-title>
          {{ user.full_name }}
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

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import { User } from '@/modules/organisations/types'

export default defineComponent({
  props: {
    user: {
      type: Object as PropType<User>,
      required: true
    }
  }
})
</script>

<style lang="sass" scoped>
.activator
  cursor: pointer
</style>
