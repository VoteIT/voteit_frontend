<script setup lang="ts" generic="T extends {}">
import { reactive, watch } from 'vue'

import useErrorHandler from '@/composables/useErrorHandler'

const props = defineProps<{
  modelValue: T
  handler(value: T): Promise<unknown>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
  (e: 'error'): void
  (e: 'done'): void
}>()

const { fieldErrors, clearErrors, handleRestError } = useErrorHandler()

const formData = reactive(props.modelValue)

watch(formData, (value) => {
  emit('update:modelValue', value as T)
  clearErrors()
})

async function submit() {
  try {
    await props.handler(formData as T)
    emit('done')
  } catch (e) {
    handleRestError(e)
    emit('error')
  }
}
</script>

<template>
  <v-form @submit.prevent="submit" v-slot="{ isValid }">
    <slot :formData="formData" :errors="fieldErrors"></slot>
    <div class="text-right">
      <slot name="buttons" :disabled="!isValid.value">
        <v-btn :text="$t('cancel')" variant="text" @click="$emit('done')" />
        <v-btn
          color="primary"
          :disabled="!isValid.value"
          :text="$t('save')"
          type="submit"
        />
      </slot>
    </div>
  </v-form>
</template>
