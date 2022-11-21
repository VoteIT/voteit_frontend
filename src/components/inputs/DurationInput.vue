<template>
  <div class="d-flex">
    <v-text-field type="number" min="0" :label="t('input.minutes')" v-model="duration.minutes" />
    <div class="mr-1" />
    <v-text-field type="number" min="0" max="59" :label="t('input.seconds')" v-model="duration.seconds" />
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0
  }
})
const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const duration = reactive({
  minutes: String(Math.floor(props.modelValue / 60)),
  seconds: String(props.modelValue % 60)
})

watch(duration, ({ minutes, seconds }) => {
  emit('update:modelValue', (Number(minutes) * 60) + Number(seconds))
})
</script>
