<script setup lang="ts">
import { onBeforeMount, ref, watch } from 'vue'

import { socket } from '@/utils/Socket'
import { openAlertEvent } from '@/utils/events'
import { AlertLevel } from '@/composables/types'
import { useI18n } from 'vue-i18n'
import SchemaForm from '@/components/SchemaForm.vue'
import { FieldType, FormSchema } from '@/components/types'
import useRules from '@/composables/useRules'

interface ContactInfo {
  text: string
  generic_email: string
  invoice_email: string
  invoice_info: string
}

const { t } = useI18n()
const rules = useRules(t)

const contactForm: FormSchema = [
  {
    type: FieldType.TextArea,
    label: t('home.contactInfo.text'),
    name: 'text'
  },
  {
    type: FieldType.Text,
    label: t('home.contactInfo.genericEmail'),
    name: 'generic_email',
    rules: [{
      props: { type: 'email' },
      validate: rules.email
    }]
  },
  {
    type: FieldType.Text,
    label: t('home.contactInfo.invoiceEmail'),
    name: 'invoice_email',
    rules: [{
      props: { type: 'email' },
      validate: rules.email
    }]
  },
  {
    type: FieldType.TextArea,
    label: t('home.contactInfo.invoiceInfo'),
    name: 'invoice_info'
  }
]

const contactInfo = ref<ContactInfo | null>(null)
const contactInfoModified = ref(false)
watch(contactInfo, () => {
  // When modified
  contactInfoModified.value = true
})

async function fetchInfo () {
  try {
    const { p } = await socket.call<ContactInfo>('contact_info.get')
    contactInfo.value = p
    contactInfoModified.value = false
  } catch (e) {
    openAlertEvent.emit({
      title: 'Contact Info',
      text: 'Failed fetching organisation contact information',
      level: AlertLevel.Error
    })
  }
}

async function saveHandler (data: ContactInfo) {
  const { p } = await socket.call('contact_info.set', data)
  console.log(p)
}

onMou(fetchInfo)
</script>

<template>
  <SchemaForm v-if="contactForm" :schema="contactForm" v-model="contactInfo" :handler="saveHandler">
    <template #buttons="{ disabled, submitting }">
      <div class="text-right">
        <v-btn
          color="primary"
          type="submit"
          variant="elevated"
          :loading="submitting"
          :disabled="disabled"
        >
          {{ t('save') }}
        </v-btn>
      </div>
    </template>
  </SchemaForm>
  <div v-else class="py-8 text-center">
    <v-progress-circular indeterminate color="primary" />
  </div>
</template>
