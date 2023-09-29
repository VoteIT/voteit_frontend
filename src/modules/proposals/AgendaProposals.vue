<template>
  <Proposal v-for="p in proposals" :key="p.pk" :p="p" class="mb-4">
    <template #buttons>
      <ButtonPlugins :proposal="p" />
    </template>
  </Proposal>
</template>

<script lang="ts" setup>
import ButtonPlugins from './ButtonPlugins.vue'
import type { Proposal } from './types'

defineProps<{ proposals: Proposal[] }>()
</script>
