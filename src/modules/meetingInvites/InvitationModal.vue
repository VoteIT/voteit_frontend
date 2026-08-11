<script setup lang="ts">
import { sorted } from 'itertools'
import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { countMatching } from '@/utils'
import restApi, { parseRestError } from '@/utils/restApi'
import type { RestError, ValueOf } from '@/utils/types'
import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'
import useRules from '@/composables/useRules'
import useMeeting from '../meetings/useMeeting'
import { MeetingRole } from '../meetings/types'

import useInviteAnnotations from './useInviteAnnotations'
import { meetingInviteAnnotationPlugins } from './registry'
import AnnotationDataTypesTable from './AnnotationDataTypesTable.vue'

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

defineEmits<{ (e: 'done'): void }>()
const props = defineProps<{
  meeting: number
}>()

const { t } = useI18n()
const rules = useRules(t)
const { meeting: m, roleLabelsEditable } = useMeeting()
const { allDataTypes } = useInviteAnnotations(m)
const rolesRequired = [MeetingRole.Participant]

const annotatedDataTypes = computed(() => {
  return sorted(
    allDataTypes.value.map((dt) => {
      if (!m.value) throw new Error('Meeting is missing')
      const possibleValues = meetingInviteAnnotationPlugins
        .getPlugin(dt.name)
        ?.getPossibleValues?.(m.value)
      return { ...dt, possibleValues }
    }),
    (dt) => dt.is_annotation
  )
})

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

function* getPossibleValuesValidators() {
  for (const dt of annotatedDataTypes.value) {
    if (!dt.possibleValues) continue
    const values = new Set(dt.possibleValues.map((pv) => pv.value))
    yield [dt.name, (v: string) => values.has(v) || `Invalid for ${dt.name}`]
  }
}

/**
 * This should possibly be a part of useInviteAnnotations / allDataTypes in future
 */
const validatorRules = computed<Record<string, ValidatorRule>>(() => {
  return {
    email: rules.email,
    swedish_ssn: rules.swedishSSN,
    ...Object.fromEntries(getPossibleValuesValidators())
  }
})

type ValidatorRule = (v: string) => true | string

function guessColumnHeader(
  values: string[]
): keyof typeof validatorRules.value | undefined {
  if (values.length === 0) return undefined
  const ruleKeys = Object.keys(
    validatorRules.value
  ) as (keyof typeof validatorRules.value)[]
  let bestKey: (typeof ruleKeys)[number] | undefined
  let bestCount = 0
  for (const key of ruleKeys) {
    const rule = validatorRules.value[key]
    const count = countMatching(values, (v) => rule(v) === true)
    if (count > bestCount) {
      bestCount = count
      bestKey = key
    }
  }
  return bestKey
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
  if (rows[0].every((value) => !value || value in validatorRules.value)) {
    const headers = rows[0].map((value) => value || null)
    return { headers, rows: rows.slice(1) }
  }
  return { headers: guessHeaders(rows), rows }
}

function* iterInviteData(rows: string[][]) {
  for (const row of rows) {
    if (row.every((value) => !value)) continue
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
      .map((row) => row.split('\t').map((value) => value.trim()))
  )
  importData.columnTypes = headers
  importData.data = [...iterInviteData(rows)]
}

const tableheaders = computed(
  () =>
    importData.columnTypes &&
    Object.entries(importData.columnTypes).map(([key, type]) => ({
      key,
      title: allDataTypes.value.find((dt) => dt.name === type)?.title
    }))
)
const unknownHeaders = computed(() =>
  Object.entries(importData.columnTypes ?? [])
    .filter((e) => e[1] === null)
    .map((e) => `header.${e[0]}`)
)

/**
 * CSV columns are positional but the API expects named fields — null type means that column has no content.
 */
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
    result.value = await restApi.post<InviteResult>('meeting-invites/', {
      data,
      meeting: props.meeting,
      roles: inviteData.roles,
      dryrun: false
    })
  } catch (e) {
    inviteErrors.value = parseRestError(e)
    importData.columnTypes = undefined
  }
  submittingInvites.value = false
}

function restart() {
  importData.columnTypes = undefined
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
          <th>{{ $t('invites.review.added') }}</th>
          <th>{{ $t('invites.review.changed') }}</th>
          <th>{{ $t('invites.review.existed') }}</th>
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
  <div v-else-if="importData.columnTypes">
    <v-alert
      v-if="unknownHeaders.length"
      class="mb-6"
      :text="$t('invites.review.errorText')"
      :title="$t('invites.review.errorTitle')"
      type="warning"
    >
      <template #append>
        <v-btn
          prepend-icon="mdi-chevron-left"
          :text="$t('navigation.back')"
          @click="restart"
        />
      </template>
    </v-alert>
    <v-alert
      v-else
      class="mb-6"
      :text="$t('invites.review.helpText')"
      :title="$t('invites.review.title')"
      type="info"
    />
    <v-data-table
      class="mb-3"
      :headers="tableheaders"
      :items="importData.data"
      :items-per-page-text="$t('content.itemsPerPageText')"
      striped="odd"
    >
      <template v-for="h in unknownHeaders" #[h] :key="h">
        <div class="d-flex align-center">
          <strong class="text-grey">
            {{ $t('invites.review.unknownColumn') }}
          </strong>
          <v-spacer />
          <v-icon
            color="warning"
            size="small"
            icon="mdi-alert"
            v-tooltip="{ text: $t('invites.review.unknownColumnTooltip') }"
          />
        </div>
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
        :text="$t('navigation.back')"
        variant="text"
        @click="restart"
      />
      <v-btn
        color="primary"
        :disabled="!!unknownHeaders.length"
        prepend-icon="mdi-account-multiple-plus"
        :text="$t('invites.review.submit')"
        type="submit"
        @click="submitInvites"
      />
    </div>
  </div>
  <v-form v-else @submit.prevent="checkData" v-slot="{ isValid }">
    <v-alert type="info" class="my-3" :title="$t('invites.mixed.helpTitle')">
      <p class="mb-3">
        {{ $t('invites.mixed.helpText') }}
      </p>
      <AnnotationDataTypesTable :dataTypes="annotatedDataTypes" />
    </v-alert>
    <v-textarea
      v-model="inviteData.user_data"
      class="mb-2"
      :error-messages="inviteErrors.data || inviteErrors.non_field_errors"
      :label="$t('invites.mixed.label')"
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
      <v-btn :text="$t('cancel')" variant="text" @click="$emit('done')" />
      <v-btn
        color="primary"
        :disabled="!isValid.value"
        :loading="submittingInvites"
        append-icon="mdi-chevron-right"
        :text="$t('invites.review.checkButton')"
        type="submit"
        variant="elevated"
      />
    </div>
  </v-form>
</template>

<style lang="sass" scoped>
.v-textarea
  tab-size: 8rem
</style>
