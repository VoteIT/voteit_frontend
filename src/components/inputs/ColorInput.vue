<script setup lang="ts">
import { ThemeColor } from '@/utils/types'

withDefaults(
  defineProps<{
    icon?: string
    label?: string
    modelValue: string
  }>(),
  {
    icon: 'mdi-brush'
  }
)

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <div>
    <v-label v-if="label" :text="label" />
    <v-item-group
      class="btn-controls"
      mandatory
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <v-item
        v-for="value in Object.values(ThemeColor)"
        :key="value"
        :value="value"
        v-slot="{ toggle, isSelected }"
      >
        <v-btn
          :icon="isSelected ? icon : 'mdi-circle'"
          :variant="isSelected ? 'elevated' : 'text'"
          :color="value"
          @click="toggle"
        />
      </v-item>
    </v-item-group>
  </div>
</template>
