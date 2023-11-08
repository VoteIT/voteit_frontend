<script setup lang="ts">
import { reactive, watch } from 'vue'

import { ArrayField } from './types'

const props = defineProps<{
  items: ArrayField['items']['oneOf']
  label: string
  modelValue: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', values: string[]): void
}>()

function constToKV(key: string): [string, boolean] {
  return [key, props.modelValue.includes(key)]
}

const values = reactive(
  Object.fromEntries(props.items.map((i) => constToKV(i.const)))
)

watch(values, (values) =>
  emit(
    'update:modelValue',
    props.items.filter((i) => values[i.const]).map((i) => i.const)
  )
)
</script>

<template>
  <div>
    <p>
      {{ label }}
    </p>
    <v-checkbox
      v-for="item in items"
      :key="item.const"
      hide-details
      :label="item.title"
      v-model="values[item.const]"
    />
  </div>
</template>
