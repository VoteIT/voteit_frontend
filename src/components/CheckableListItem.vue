<script setup lang="ts">
defineProps<{
  disabled?: boolean
  modelValue?: boolean
  subtitle?: string
  title: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()
</script>

<template>
  <v-list-item
    :prepend-icon="
      modelValue ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'
    "
    :active="modelValue"
    :disabled="disabled"
    :subtitle="subtitle"
    :title="title"
    @click.stop="$emit('update:modelValue', !modelValue)"
  />
</template>
