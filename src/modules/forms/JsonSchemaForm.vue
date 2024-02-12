<script setup lang="ts" generic="T extends {}">
import { computed } from 'vue'

import type { JsonSchema } from './types'
import JsonProperties from './JsonProperties.vue'

const props = defineProps<{
  errors?: Partial<Record<string, string[]>>
  modelValue: T
  schema: JsonSchema<T>
}>()

defineEmits<{
  (e: 'update:modelValue', value: T): void
}>()

const nonFieldErrors = computed(() => {
  return props.errors?.__root__
})
</script>

<template>
  <div>
    <div v-if="nonFieldErrors" class="text-warning mb-2">
      <p v-for="err in nonFieldErrors" :key="err">
        {{ err }}
      </p>
    </div>
    <JsonProperties
      :modelValue="modelValue as T"
      @update:modelValue="$emit('update:modelValue', $event)"
      :errors="errors"
      :properties="schema.properties"
      :required="schema.required"
    />
  </div>
</template>
