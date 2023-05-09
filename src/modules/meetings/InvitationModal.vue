<script setup lang="ts">
import { Dictionary } from 'lodash'
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { parseSocketError, socket } from '@/utils/Socket'
import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'
import useRules from '@/composables/useRules'
import useMeeting from './useMeeting'

const props = defineProps<{
  type: string
  meeting: number
}>()

const emit = defineEmits<{(e: 'done'): void}>()

const { t } = useI18n()
const rules = useRules(t)
const { roleLabelsEditable } = useMeeting()
const rolesRequired = ['participant']

const submittingInvites = ref(false)
const inviteData = reactive({
  user_data: '',
  roles: rolesRequired,
  valid: false
})
const inviteErrors = ref<Dictionary<string[]>>({})
watch(() => inviteData.user_data, () => {
  inviteErrors.value = {}
})

const ruleMapping = {
  email: [rules.multiline(rules.trimmed(rules.email)), rules.required],
  swedish_ssn: [rules.multiline(rules.trimmed(rules.swedishSSN)), rules.required]
}

// Dynamic translation strings and rules
const inviteInputProps = {
  label: t(`invites.${props.type}.label`),
  hint: t(`invites.${props.type}.hint`),
  rules: ruleMapping[props.type as keyof typeof ruleMapping] || [rules.required]
}

async function submitInvites () {
  inviteErrors.value = {}
  submittingInvites.value = true
  try {
    await socket.call('invites.add', {
      columns: [props.type],
      meeting: props.meeting,
      rows: inviteData.user_data,
      roles: inviteData.roles
    }, { alertOnError: false })
    emit('done')
    inviteData.user_data = ''
    inviteData.roles = rolesRequired
  } catch (e) {
    inviteErrors.value = parseSocketError(e as Error)
  }
  submittingInvites.value = false
}
</script>

<template>
  <v-form @submit.prevent="submitInvites" v-model="inviteData.valid" ref="invitationsForm">
    <v-textarea
      v-model="inviteData.user_data"
      class="mb-2"
      :error-messages="inviteErrors.columns || inviteErrors.rows || inviteErrors.__root__"
      rows="10"
      v-bind="inviteInputProps"
    />
    <CheckboxMultipleSelect
      v-model="inviteData.roles"
      :settings="{ options: roleLabelsEditable }"
      :label="t('accessPolicy.rolesGiven')"
      :requiredValues="rolesRequired"
    />
    <div class="text-right">
      <v-btn
        type="submit"
        color="primary"
        prepend-icon="mdi-account-multiple-plus"
        :loading="submittingInvites"
        :disabled="!inviteData.valid || submittingInvites"
        variant="elevated"
      >
        {{ t('add') }}
      </v-btn>
    </div>
  </v-form>
</template>
