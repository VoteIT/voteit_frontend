<script setup lang="ts">
import { Dictionary } from 'lodash'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { parseSocketError, socket } from '@/utils/Socket'
import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'
import useRules from '@/composables/useRules'
import useMeeting from './useMeeting'
import { invitationScopes } from '../organisations/registry'

const props = defineProps<{
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

const scopes = computed(() => {
  const activeScopes = invitationScopes.getActivePlugins()
  return activeScopes.map(({ id }) => id)
})

async function submitInvites () {
  inviteErrors.value = {}
  submittingInvites.value = true
  const rows = inviteData.user_data.split('\n')
    .map(row => row.split('\t'))
  const columns = rows.shift()
  try {
    await socket.call('invites.add_mixed', {
      columns,
      rows,
      roles: inviteData.roles,
      ...props
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
    <v-alert type="info" class="my-3" :title="t('invites.mixed.helpTitle')">
      <p class="mb-3">
        {{ t('invites.mixed.helpText') }}
      </p>
      <v-table density="compact" >
        <tbody>
          <tr>
            <td v-for="scope in scopes" :key="scope">
              {{ scope }}
            </td>
          </tr>
          <tr>
            <td v-for="scope in scopes" :key="scope">
              ...
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-alert>
    <v-textarea
      v-model="inviteData.user_data"
      class="mb-2"
      :error-messages="inviteErrors.columns || inviteErrors.rows || inviteErrors.__root__"
      rows="10"
      :label="t('invites.mixed.label')"
      :rules="[rules.required]"
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
