<script lang="ts" setup>
import { computed, reactive, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { parseRestError } from '@/utils/restApi'
import type { RestError } from '@/utils/types'

import Headline from '@/components/Headline.vue'
import RichtextEditor from '@/components/RichtextEditor.vue'
import useRules from '@/composables/useRules'

import useOrgStore from './useOrgStore'
import { type IOrganisation } from './types'

const props = defineProps<{ organisation: IOrganisation }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n()
const orgStore = useOrgStore()
const rules = useRules(t)

const formErrors = shallowRef<RestError<IOrganisation> | null>(null)
const changeForm = reactive({
  body: props.organisation.body,
  page_title: props.organisation.page_title
})
watch(
  () => props.organisation,
  (org) => {
    changeForm.body = org.body
    changeForm.page_title = org.page_title
  }
)
watch(changeForm, () => (formErrors.value = null), { deep: true })

const formChanged = computed(
  () =>
    changeForm.body !== props.organisation.body ||
    changeForm.page_title !== props.organisation.page_title
)

async function save() {
  try {
    await orgStore.updateOrganisation(changeForm)
    emit('close')
  } catch (e) {
    formErrors.value = parseRestError(e)
  }
}

function cancel() {
  changeForm.body = props.organisation.body
  changeForm.page_title = props.organisation.page_title
  emit('close')
}
</script>

<template>
  <v-form @submit.prevent="save">
    <Headline
      editing
      :error-messages="formErrors?.page_title"
      :rules="[rules.required]"
      v-model="changeForm.page_title"
      @submit="save"
    />
    <RichtextEditor
      :error-messages="formErrors?.body"
      variant="full"
      v-model="changeForm.body"
      @keydown.ctrl.enter="save"
    />
    <v-expand-transition>
      <div v-if="formErrors?.non_field_errors">
        <v-alert
          class="mb-3"
          :text="formErrors.non_field_errors.join(', ')"
          type="error"
        />
      </div>
    </v-expand-transition>
    <div class="text-right">
      <v-btn :text="$t('cancel')" variant="text" @click="cancel" />
      <v-btn
        color="primary"
        :disabled="!formChanged"
        :text="$t('save')"
        type="submit"
      />
    </div>
  </v-form>
</template>
