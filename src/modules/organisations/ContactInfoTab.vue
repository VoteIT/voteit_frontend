<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import SchemaForm from '@/components/SchemaForm.vue'
import { FieldType, FormSchema } from '@/components/types'
import useRules from '@/composables/useRules'
import useContactInfo, { type ContactInfo } from './useContactInfo'
import useErrorHandler from '@/composables/useErrorHandler'

const { t } = useI18n()
const rules = useRules(t)

const contactForm: FormSchema = [
  {
    type: FieldType.Text,
    label: t('home.contactInfo.genericEmail'),
    name: 'generic_email',
    rules: [
      {
        props: { type: 'email' },
        validate: rules.email
      }
    ]
  },
  {
    type: FieldType.TextArea,
    label: t('home.contactInfo.text'),
    name: 'text'
  },
  {
    type: FieldType.Text,
    label: t('home.contactInfo.invoiceEmail'),
    name: 'invoice_email',
    rules: [
      {
        props: { type: 'email' },
        validate: rules.email
      }
    ]
  },
  {
    type: FieldType.TextArea,
    label: t('home.contactInfo.invoiceInfo'),
    name: 'invoice_info'
  }
]

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
      @click="updateContactInfo"
      prepend-icon="mdi-autorenew"
    >
      {{ $t('tryAgain') }}
    </v-btn>
  </div>
  <div v-else>
    <v-alert
      :type="requiresCheck ? 'warning' : 'info'"
      :text="$t('home.contactInfo.help')"
      class="my-3"
    />
    <SchemaForm
      v-if="changeForm"
      :schema="contactForm"
      v-model="changeForm"
      :handler="saveHandler"
    >
      <template #buttons="{ disabled, submitting }">
        <div class="d-flex">
          <p v-if="contactInfoModified" class="text-secondary">
            {{ $t('home.contactInfo.modified') }}
          </p>
          <v-spacer />
          <v-btn
            color="primary"
            type="submit"
            :loading="submitting"
            :disabled="disabled"
          >
            {{ $t('save') }}
          </v-btn>
        </div>
      </template>
    </SchemaForm>
    <div v-else class="py-8 text-center">
      <v-progress-circular indeterminate color="primary" />
    </div>
  </div>
</template>
