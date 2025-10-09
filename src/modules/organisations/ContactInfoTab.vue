<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import useRules from '@/composables/useRules'
import useContactInfo, { type ContactInfo } from './useContactInfo'
import useErrorHandler from '@/composables/useErrorHandler'
import DefaultForm from '@/components/DefaultForm.vue'

const { t } = useI18n()
const rules = useRules(t)

const { handleSocketError } = useErrorHandler({ target: 'dialog' })
const { contactInfo, requiresCheck, fetchContactInfo, saveContactInfo } =
  useContactInfo()

const fetchFailed = ref(false)
const changeForm = ref(contactInfo.value)
const contactInfoModified = computed(() => {
  if (!changeForm.value) return false
  return Object.entries(changeForm.value).some(
    ([key, value]) => contactInfo.value![key as keyof ContactInfo] !== value
  )
})

async function saveHandler(data: ContactInfo) {
  try {
    changeForm.value = await saveContactInfo(data)
  } catch (e) {
    handleSocketError(e)
  }
}

async function updateContactInfo() {
  fetchFailed.value = false
  try {
    changeForm.value = await fetchContactInfo()
  } catch {
    fetchFailed.value = true
  }
}

onBeforeMount(updateContactInfo)
</script>

<template>
  <div v-if="fetchFailed" class="text-center">
    <p class="my-4 text-warning">Could not fetch contact info</p>
    <v-btn
      color="primary"
      prepend-icon="mdi-autorenew"
      :text="$t('tryAgain')"
      @click="updateContactInfo"
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
            :disabled="disabled"
            :loading="submitting"
            :text="$t('save')"
            type="submit"
          />
        </div>
      </template>
    </DefaultForm>
    <div v-else class="py-8 text-center">
      <v-progress-circular indeterminate color="primary" />
    </div>
  </div>
</template>
