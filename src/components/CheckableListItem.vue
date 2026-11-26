<script setup lang="ts">
defineProps<{
  disabled?: boolean
  subtitle?: string
  title: string
}>()

const model = defineModel<boolean>({ default: false })
</script>

<template>
  <v-list-item
    :prepend-icon="model ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'"
    :active="model"
    :disabled="disabled"
    :subtitle="subtitle"
    :title="title"
    @click="model = !model"
  />
</template>
