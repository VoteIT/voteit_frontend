<script setup lang="ts">
import { Dictionary } from 'lodash'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { parseSocketError } from 'envelope-client'

import { socket } from '@/utils/Socket'
import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'
import useRules from '@/composables/useRules'
import { invitationScopes } from '../organisations/registry'
import useMeeting from '../meetings/useMeeting'
import { MeetingRole } from '../meetings/types'

import { MeetingInvite } from './types'
import { translateInviteType } from './utils'

interface InviteResult {
  added: number
  changed: number
  existed: number
}

defineEmits<{ (e: 'done'): void }>()
const props = defineProps<{
  type?: keyof MeetingInvite['user_data']
  meeting: number
}>()

const { t } = useI18n()
const rules = useRules(t)
const { roleLabelsEditable } = useMeeting()
const rolesRequired = [MeetingRole.Participant]

const submittingInvites = ref(false)
const inviteData = reactive({
  user_data: '',
  roles: rolesRequired,
  valid: false
})
const inviteErrors = ref<Dictionary<string[]>>({})
watch(
  () => inviteData.user_data,
  () => {
    inviteErrors.value = {}
  }
)

const ruleMapping = {
  email: [rules.multiline(rules.trimmed(rules.email)), rules.required],
  swedish_ssn: [
    rules.multiline(rules.trimmed(rules.swedishSSN)),
    rules.required
  ]
}

// Dynamic translation strings and rules
const { hint, label } = translateInviteType(props.type, t)
const inviteInputProps = {
  hint,
  label,
  rules: props.type ? ruleMapping[props.type] : [rules.required]
}

const scopes = computed(() =>
  invitationScopes.getActivePlugins().map(({ id }) => id)
)

const result = ref<null | InviteResult>(null)
async function submitInvites() {
  inviteErrors.value = {}
  submittingInvites.value = true
  const userData = inviteData.user_data.split('\n')
  const [columns, ...rows] = props.type // If type is not supplied, get columns from first row
    ? [[props.type], ...userData]
    : userData.map((row) => row.split('\t'))
  try {
    const { p } = await socket.call<InviteResult>('invites.add', {
      columns,
      meeting: props.meeting,
      rows,
      roles: inviteData.roles
    })
    result.value = p
  } catch (e) {
    inviteErrors.value = parseSocketError(e as Error)
  }
  submittingInvites.value = false
}
</script>

<template>
  <div v-if="result">
    <p class="mb-3">
      {{ $t('invites.done') }}
    </p>
    <v-table>
      <thead>
        <tr>
          <th>Added</th>
          <th>Changed</th>
          <th>Existed</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{ result.added }}</td>
          <td>{{ result.changed }}</td>
          <td>{{ result.existed }}</td>
        </tr>
      </tbody>
    </v-table>
    <div class="text-right">
      <v-btn
        color="primary"
        :text="$t('close')"
        variant="elevated"
        @click="$emit('done')"
      />
    </div>
  </div>
  <v-form v-else @submit.prevent="submitInvites" v-model="inviteData.valid">
    <v-alert
      v-if="!type"
      type="info"
      class="my-3"
      :title="$t('invites.mixed.helpTitle')"
    >
      <p class="mb-3">
        {{ $t('invites.mixed.helpText') }}
      </p>
      <v-table density="compact">
        <tbody>
          <tr>
            <td v-for="scope in scopes" :key="scope">
              {{ scope }}
            </td>
          </tr>
          <tr>
            <td v-for="scope in scopes" :key="scope">...</td>
          </tr>
        </tbody>
      </v-table>
    </v-alert>
    <v-textarea
      v-model="inviteData.user_data"
      class="mb-2"
      :error-messages="
        inviteErrors.columns || inviteErrors.rows || inviteErrors.__root__
      "
      rows="10"
      v-bind="inviteInputProps"
    />
    <CheckboxMultipleSelect
      v-model="inviteData.roles"
      :settings="{ options: roleLabelsEditable }"
      :label="$t('selectRoles')"
      :requiredValues="rolesRequired"
    />
    <div class="text-right">
      <v-btn
        color="primary"
        :disabled="!inviteData.valid || submittingInvites"
        :loading="submittingInvites"
        prepend-icon="mdi-account-multiple-plus"
        :text="$t('add')"
        type="submit"
        variant="elevated"
      />
    </div>
  </v-form>
</template>
