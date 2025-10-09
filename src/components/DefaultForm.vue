<script setup lang="ts" generic="T extends {}">
import { reactive, shallowRef, watch } from 'vue'

import useErrorHandler from '@/composables/useErrorHandler'

const props = defineProps<{
  handler(value: T): Promise<unknown>
  modelValue: T
  saveText?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
  (e: 'error'): void
  (e: 'done'): void
}>()

const { fieldErrors, clearErrors, handleError } = useErrorHandler()

const formData = reactive(props.modelValue)

watch(formData, (value) => {
  emit('update:modelValue', value as T)
  clearErrors()
})

const submitting = shallowRef(false)

async function submit() {
  submitting.value = true
  try {
    await props.handler(formData as T)
    emit('done')
  } catch (e) {
    handleError(e)
    emit('error')
  }
  submitting.value = false
}
</script>

<template>
  <v-form @submit.prevent="submit" v-slot="{ isValid }">
    <slot :formData="formData" :errors="fieldErrors"></slot>
    <div class="text-right">
      <slot name="buttons" :disabled="!isValid.value" :submitting="submitting">
        <v-btn :text="$t('cancel')" variant="text" @click="$emit('done')" />
        <v-btn
          color="primary"
          :disabled="!isValid.value"
          :loading="submitting"
          :text="saveText ?? $t('save')"
          type="submit"
        />
      </slot>
    </div>
  </v-form>
</template>
