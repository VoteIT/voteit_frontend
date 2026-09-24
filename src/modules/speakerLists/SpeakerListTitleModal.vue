<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import DefaultForm from '@/components/DefaultForm.vue'
import useRules from '@/composables/useRules'

defineProps<{
  handler(data: { title: string }): Promise<unknown>
  title: string
}>()

defineEmits<{
  (e: 'done'): void
}>()

const { t } = useI18n()
const rules = useRules(t)
</script>

<template>
  <DefaultForm
    :model-value="{ title }"
    :handler="handler"
    @done="$emit('done')"
    v-slot="{ errors, formData }"
  >
    <v-text-field
      :label="$t('name')"
      :error-messages="errors.title"
      v-model="formData.title"
      :rules="[rules.required, rules.minLength(3)]"
    />
  </DefaultForm>
</template>
