<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import restApi, { parseRestError } from '@/utils/restApi'
import type { RestError, ValueOf } from '@/utils/types'
import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'
import useRules from '@/composables/useRules'
import { invitationScopes } from '../organisations/registry'
import useGroupStore from '../meetings/useGroupStore'
import useMeeting from '../meetings/useMeeting'
import { MeetingRole } from '../meetings/types'

import { translateInviteType } from './utils'
import { countMatching } from '@/utils'

interface InviteData {
  data: Record<string, string>[]
  dryrun: boolean
  meeting: number
  roles: ValueOf<MeetingRole>[]
}

interface InviteResult {
  invites: {
    added: number
    changed: number
    existed: number
  }
  dryrun: boolean
  annotations: [] // TODO
}

const validHeaders = new Set<string>(
  invitationScopes.getActivePlugins().map((p) => p.id)
)
validHeaders.add('group') // TODO All annotation values

defineEmits<{ (e: 'done'): void }>()
const props = defineProps<{
  meeting: number
}>()

const { t } = useI18n()
const rules = useRules(t)
const { roleLabelsEditable } = useMeeting()
const { filterGroups } = useGroupStore()
const rolesRequired = [MeetingRole.Participant]

const submittingInvites = ref(false)
const inviteData = reactive({
  user_data: '',
  roles: rolesRequired
})
const inviteErrors = shallowRef<RestError<InviteData>>({})
watch(
  inviteData,
  () => {
    inviteErrors.value = {}
  },
  { deep: true }
)

// const ruleMapping = {
//   email: [rules.multiline(rules.trimmed(rules.email)), rules.required],
//   swedish_ssn: [
//     rules.multiline(rules.trimmed(rules.swedishSSN)),
//     rules.required
//   ]
// }

const groupIds = computed(() =>
  filterGroups((g) => g.meeting === props.meeting).map((g) => g.groupid)
)

const validatorRules = {
  email: rules.email,
  swedish_ssn: rules.swedishSSN,
  group(value: string) {
    return groupIds.value.includes(value) || 'Invalid group'
  }
} as const

const HEADER_VALIDATION_THRESHHOLD = 0.9

type ValidatorRule = (v: string) => true | string

function matchRatio(values: string[], rule: ValidatorRule): number {
  return countMatching(values, (v) => rule(v) === true) / values.length
}

/**
 * Returns the first validatorRule key where the first value passes (quick check)
 * and >= HEADER_VALIDATION_THRESHHOLD of all values pass. Returns undefined if
 * no rule reaches the threshold.
 */
function guessColumnHeader(
  values: string[]
): keyof typeof validatorRules | undefined {
  if (values.length === 0) return undefined
  const ruleKeys = Object.keys(
    validatorRules
  ) as (keyof typeof validatorRules)[]
  for (const key of ruleKeys) {
    const rule = validatorRules[key]
    if (rule(values[0]) !== true) continue
    if (matchRatio(values, rule) >= HEADER_VALIDATION_THRESHHOLD) return key
  }
}

/**
 * For each column, finds the first validatorRule where the first value passes
 * and >= HEADER_VALIDATION_THRESHHOLD of all values pass. Returns 'unknown-{n}'
 * if no rule reaches the threshold for that column.
 */
function guessHeaders(rows: string[][]) {
  if (rows.length === 0) return []
  return Array.from({ length: rows[0].length }, (_, col) => {
    const values = rows.map((row) => row[col]).filter(Boolean)
    return guessColumnHeader(values) ?? null
  })
}

function parseRows(rows: string[][]) {
  if (rows[0].every((value) => validHeaders.has(value))) {
    const headers = rows[0]
    return { headers, rows: rows.slice(1) }
  }
  return { headers: guessHeaders(rows), rows }
}

function* iterInviteData(rows: string[][]) {
  for (const row of rows) {
    if (row.every((value) => !value.trim())) continue
    yield Object.fromEntries(
      row.map((value, i) => [i, value]).filter((r) => !!r[1])
    )
  }
}

const importData = reactive({
  columnTypes: undefined as (string | null)[] | undefined,
  data: [] as Record<number, string>[]
})
function checkData() {
  const { headers, rows } = parseRows(
    inviteData.user_data
      .trim()
      .split('\n')
      .map((row) => row.split('\t'))
  )
  importData.columnTypes = headers
  importData.data = [...iterInviteData(rows)]
}

const tableheaders = computed(
  () =>
    importData.columnTypes &&
    Object.keys(importData.columnTypes).map((_, i) => ({
      key: i.toString()
    }))
)
function headerChoicesFor(colIndex: number) {
  const takenTypes = new Set(
    importData.columnTypes!.filter((t, i) => i !== colIndex && t !== null)
  )
  return [
    ...invitationScopes.getActivePlugins().map(({ id }) => ({
      value: id,
      title: translateInviteType(id, t).typeLabel,
      disabled: takenTypes.has(id)
    })),
    { value: 'group', title: 'Group', disabled: takenTypes.has('group') },
    { value: null, title: '- ignore -', disabled: false }
  ]
}

const scopes = computed(() =>
  invitationScopes.getActivePlugins().map(({ id }) => id)
)

function* mapRow(row: Record<number, string>, columnTypes: (string | null)[]) {
  for (const [i, type] of columnTypes.entries()) {
    if (type !== null && row[i] != null) yield [type, row[i]] as const
  }
}

const result = ref<null | InviteResult>(null)
async function submitInvites() {
  inviteErrors.value = {}
  submittingInvites.value = true
  try {
    const data = importData.data.map((row) =>
      Object.fromEntries(
        mapRow(row as Record<number, string>, importData.columnTypes!)
      )
    )
    const response = await restApi.post<InviteResult>('meeting-invites/', {
      data,
      meeting: props.meeting,
      roles: inviteData.roles,
      dryrun: true // Change
    })
    result.value = response.data
  } catch (e) {
    inviteErrors.value = parseRestError(e)
    importData.columnTypes = undefined
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
          <td>{{ result.invites.added }}</td>
          <td>{{ result.invites.changed }}</td>
          <td>{{ result.invites.existed }}</td>
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
  <v-form
    v-else-if="importData.columnTypes"
    @submit.prevent="submitInvites"
    v-slot="{ isValid }"
  >
    <v-alert
      class="mb-6"
      text="Kontrollera att inbjudningarna ser rätt ut innan du lägger till dem."
      title="Kontrollera inbjudningar"
      type="info"
    />
    <v-data-table class="mb-3" :headers="tableheaders" :items="importData.data">
      <template #headers="{ headers }">
        <tr>
          <th v-for="header in headers[0]" :key="header.key ?? '_'">
            <v-select
              density="compact"
              :items="headerChoicesFor(Number(header.key))"
              variant="outlined"
              v-model="importData.columnTypes[Number(header.key)]"
            >
              <template #item="{ item, props }">
                <v-list-item v-bind="props" :disabled="item.raw.disabled" />
              </template>
            </v-select>
          </th>
        </tr>
      </template>
    </v-data-table>
    <CheckboxMultipleSelect
      v-model="inviteData.roles"
      :error-messages="inviteErrors.roles"
      :label="$t('selectRoles')"
      :requiredValues="rolesRequired"
      :settings="{ options: roleLabelsEditable }"
    />
    <div class="text-right">
      <v-btn
        prepend-icon="mdi-chevron-left"
        text="Tillbaka"
        variant="text"
        @click="importData.columnTypes = undefined"
      />
      <v-btn
        color="primary"
        :disabled="!isValid.value"
        prepend-icon="mdi-account-multiple-plus"
        text="Lägg till inbjudningar"
        type="submit"
      />
    </div>
  </v-form>
  <v-form v-else @submit.prevent="checkData" v-slot="{ isValid }">
    <v-alert type="info" class="my-3" :title="$t('invites.mixed.helpTitle')">
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
      :error-messages="inviteErrors.data || inviteErrors.non_field_errors"
      rows="10"
      :rules="[rules.required]"
    />
    <CheckboxMultipleSelect
      v-model="inviteData.roles"
      :error-messages="inviteErrors.roles"
      :label="$t('selectRoles')"
      :requiredValues="rolesRequired"
      :settings="{ options: roleLabelsEditable }"
    />
    <div class="text-right">
      <v-btn
        color="primary"
        :disabled="!isValid.value"
        :loading="submittingInvites"
        prepend-icon="mdi-account-multiple-plus"
        :text="$t('add')"
        type="submit"
        variant="elevated"
      />
    </div>
  </v-form>
</template>
