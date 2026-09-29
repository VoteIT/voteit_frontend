<script setup lang="ts">
import Richtext from '@/components/Richtext.vue'

defineProps<{
  globalBody?: string
  body?: string
}>()
</script>

<template>
  <Richtext v-if="globalBody" :value="globalBody" />
  <v-divider v-if="body && globalBody" class="my-4" />
  <Richtext v-if="body" :value="body" />
</template>
