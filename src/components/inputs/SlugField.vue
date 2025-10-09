<script setup lang="ts">
import { slugify } from '@/utils'
import { shallowRef, watch } from 'vue'

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const internalValue = shallowRef(props.modelValue ?? '')

watch(internalValue, (value) => emit('update:modelValue', value))

function cleanInput() {
  internalValue.value = slugify(internalValue.value)
}
</script>

<template>
  <v-text-field
    v-model="internalValue"
    @update:focused="cleanInput"
    @keydown.enter="cleanInput"
  />
</template>
