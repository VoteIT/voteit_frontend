<script setup lang="ts">
import Richtext from '@/components/Richtext.vue'

defineProps<{
  /** The global terms */
  globalBody: string
  /** The organisation's addition, if it has one */
  body?: string
}>()
</script>

<template>
  <Richtext :value="globalBody" />
  <template v-if="body">
    <v-divider class="my-4" />
    <Richtext :value="body" />
  </template>
</template>
