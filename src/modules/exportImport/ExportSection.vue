<script lang="ts" setup>
import { computed, shallowReactive, type ComputedRef } from 'vue'
import { ComposerTranslation, useI18n } from 'vue-i18n'

import useRules from '@/composables/useRules'
import { getApiLink } from '@/utils/restApi'
import useMeetingId from '../meetings/useMeetingId'

interface ExportOption {
  key: string
  default: boolean
  translate(t: ComposerTranslation): string
}

const exportOptions: ExportOption[] = [
  // THESE ARE IMPORT OPTIONS
  // {
  //   key: 'add_participants',
  //   default: false,
  //   translate: (t) => t('exportImport.options.addParticipants')
  // },
  // {
  //   key: 'use_existing_groups',
  //   default: false,
  //   translate: (t) => t('exportImport.options.useExistingGroups')
  // },
  {
    key: 'clear_group_authors',
    default: false,
    translate: (t) => t('exportImport.options.clearGroupAuthors')
  },
  {
    key: 'clear_authors',
    default: false,
    translate: (t) => t('exportImport.options.clearAuthors')
  },
  {
    key: 'clear_ai_states',
    default: false,
    translate: (t) => t('exportImport.options.clearAiStates')
  },
  {
    key: 'clear_proposal_states',
    default: false,
    translate: (t) => t('exportImport.options.clearProposalStates')
  },
  {
    key: 'clear_proposal_id',
    default: false,
    translate: (t) => t('exportImport.options.clearProposalId')
  },
  {
    key: 'include_groups',
    default: true,
    translate: (t) => t('meeting.groups.groups')
  },
  {
    key: 'include_proposals',
    default: true,
    translate: (t) => t('proposal.proposals')
  },
  {
    key: 'include_discussions',
    default: true,
    translate: (t) => t('discussion.discussion')
  },
  {
    key: 'include_buttons',
    default: true,
    translate: (t) => t('reaction.buttons')
  },
  {
    key: 'include_reactions',
    default: false,
    translate: (t) => t('reaction.peopleReacted')
  }
]

const { t } = useI18n()
const rules = useRules(t)

const options = computed(() =>
  exportOptions.map((option) => ({
    ...option,
    title: option.translate(t)
  }))
)

const values = shallowReactive<Record<string, boolean>>(
  Object.fromEntries(
    exportOptions.map((option) => [option.key, option.default])
  )
)

const clearOptions = computed(() =>
  options.value.filter((option) => option.key.startsWith('clear_'))
)

const includeOptions = computed(() =>
  options.value.filter((option) => option.key.startsWith('include_'))
)

function selectionModel(group: ComputedRef<{ key: string }[]>) {
  return computed<string[]>({
    get: () =>
      group.value.filter((option) => values[option.key]).map((o) => o.key),
    set: (keys) => {
      for (const option of group.value) {
        values[option.key] = keys.includes(option.key)
      }
    }
  })
}

const clearSelected = selectionModel(clearOptions)
const includeSelected = selectionModel(includeOptions)

const meetingId = useMeetingId()

function download() {
  const params = new URLSearchParams()
  for (const [key, enabled] of Object.entries(values)) {
    if (enabled) params.set(key, 'true')
  }
  const url = getApiLink(`meeting-data/${meetingId.value}/yaml?${params}`)
  window.open(url, '_blank')
}
</script>

<template>
  <div>
    <header class="mb-6">
      <h2>
        {{ $t('exportImport.exportFromMeeting') }}
      </h2>
      <p>{{ $t('exportImport.exportFromMeetingDescription') }}</p>
    </header>
    <v-form @submit.prevent="download" v-slot="{ isValid }">
      <v-select
        v-model="includeSelected"
        :items="includeOptions"
        item-title="title"
        item-value="key"
        :label="$t('exportImport.options.includeLabel')"
        :rules="[rules.required]"
        multiple
        chips
        closable-chips
      />
      <v-select
        v-model="clearSelected"
        :items="clearOptions"
        item-title="title"
        item-value="key"
        :label="$t('exportImport.options.clearLabel')"
        multiple
        chips
        closable-chips
      />
      <div class="text-right">
        <v-btn
          color="primary"
          :disabled="!isValid.value"
          prepend-icon="mdi-download"
          :text="$t('exportImport.exportFromMeeting')"
          type="submit"
        />
      </div>
    </v-form>
  </div>
</template>
