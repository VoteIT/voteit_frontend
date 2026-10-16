<template>
  <v-input :error-messages="errorMessages">
    <div class="d-flex flex-grow-1">
      <v-text-field
        type="number"
        min="0"
        :error="!!errorMessages?.length"
        hide-details
        :label="$t('input.minutes')"
        v-model="duration.minutes"
      />
      <div class="mr-1"></div>
      <v-text-field
        type="number"
        min="0"
        max="59"
        :error="!!errorMessages?.length"
        hide-details
        :label="$t('input.seconds')"
        v-model="duration.seconds"
      />
    </div>
  </v-input>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'

const props = withDefaults(
  defineProps<{ errorMessages?: string | string[]; modelValue?: number }>(),
  { modelValue: 0 }
)
const emit = defineEmits(['update:modelValue'])

const duration = reactive({
  minutes: String(Math.floor(props.modelValue / 60)),
  seconds: String(props.modelValue % 60)
})

watch(duration, ({ minutes, seconds }) => {
  emit('update:modelValue', Number(minutes) * 60 + Number(seconds))
})
</script>
