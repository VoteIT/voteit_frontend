<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useRules from '@/composables/useRules'
import useContactInfo, { type ContactInfo } from './useContactInfo'
import DefaultForm from '@/components/DefaultForm.vue'

const { t } = useI18n()
const rules = useRules(t)

const {
  contactInfo,
  status,
  requiresCheck,
  fetchContactInfo,
  saveContactInfo
} = useContactInfo()

/**
 * What the form edits, as a new object - the form edits the object it's given,
 * and a save changes other fields (modified, requires_check) too.
 */
function getEditable({
  generic_email,
  text,
  invoice_email,
  invoice_info
}: ContactInfo) {
  return { generic_email, text, invoice_email, invoice_info }
}
type EditableContactInfo = ReturnType<typeof getEditable>

// The form keeps this object after a save, so it's only filled once
const changeForm = ref(contactInfo.value && getEditable(contactInfo.value))
// The panel opens before contact info is in, if it hasn't arrived yet
watch(contactInfo, (info) => {
  if (info && !changeForm.value) changeForm.value = getEditable(info)
})
const contactInfoModified = computed(() => {
  if (!changeForm.value || !contactInfo.value) return false
  const saved = getEditable(contactInfo.value)
  return Object.entries(changeForm.value).some(
    ([key, value]) => saved[key as keyof EditableContactInfo] !== value
  )
})

// Errors are handled by the form
async function saveHandler(data: EditableContactInfo) {
  await saveContactInfo(data)
}
</script>

<template>
  <div v-if="!contactInfo" class="text-center">
    <p class="my-4 text-warning">
      {{ $t('home.contactInfo.fetchFailed') }}
    </p>
    <v-btn
      color="primary"
      :loading="status === 'loading'"
      prepend-icon="mdi-autorenew"
      :text="$t('tryAgain')"
      @click="fetchContactInfo"
    />
  </div>
  <div v-else>
    <v-alert
      :type="requiresCheck ? 'warning' : 'info'"
      :text="$t('home.contactInfo.help')"
      class="my-3"
    />
    <DefaultForm
      v-if="changeForm"
      :model-value="changeForm"
      :handler="saveHandler"
    >
      <template #default="{ errors, formData }">
        <v-text-field
          :error-messages="errors.generic_email"
          :label="$t('home.contactInfo.genericEmail')"
          :rules="[rules.email]"
          type="email"
          v-model="formData.generic_email"
        />
        <v-textarea
          :label="$t('home.contactInfo.text')"
          v-model="formData.text"
        />
        <v-text-field
          :error-messages="errors.invoice_email"
          :label="$t('home.contactInfo.invoiceEmail')"
          :rules="[rules.email]"
          type="email"
          v-model="formData.invoice_email"
        />
        <v-textarea
          :label="$t('home.contactInfo.invoiceInfo')"
          v-model="formData.invoice_info"
        />
      </template>
      <template #buttons="{ disabled, submitting }">
        <div class="d-flex">
          <p v-if="contactInfoModified" class="text-secondary">
            {{ $t('home.contactInfo.modified') }}
          </p>
          <v-spacer />
          <v-btn
            color="primary"
            :disabled="disabled || !contactInfoModified"
            :loading="submitting"
            :text="$t('save')"
            type="submit"
          />
        </div>
      </template>
    </DefaultForm>
  </div>
</template>
