<script setup lang="ts">
import { reactive, watch } from 'vue'

defineProps<{ errorMessages?: string | string[] }>()
const model = defineModel<number>({ default: 0 })

const duration = reactive({
  minutes: String(Math.floor(model.value / 60)),
  seconds: String(model.value % 60)
})

watch(duration, ({ minutes, seconds }) => {
  model.value = Number(minutes) * 60 + Number(seconds)
})
</script>

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
