<script lang="ts" setup>
import { computed, shallowReactive, type ComputedRef } from 'vue'
import { ComposerTranslation, useI18n } from 'vue-i18n'

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

// When the user sets `when[0]` to `when[1]`, force `force[0]` to `force[1]`
// to keep export-option combinations valid.
const constraints: Array<{
  when: [string, boolean]
  force: [string, boolean]
}> = [
  // clear_group_authors and include_groups can't both be false
  { when: ['include_groups', false], force: ['clear_group_authors', true] },
  { when: ['clear_group_authors', false], force: ['include_groups', true] },
  // include_buttons can't be false while include_reactions is true
  { when: ['include_reactions', true], force: ['include_buttons', true] },
  { when: ['include_buttons', false], force: ['include_reactions', false] }
]

const { t } = useI18n()

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
      // Apply the user's own changes first, then resolve constraints — so a
      // forced value isn't clobbered by a later option in the same group.
      const changed: string[] = []
      for (const option of group.value) {
        const next = keys.includes(option.key)
        if (values[option.key] === next) continue
        values[option.key] = next
        changed.push(option.key)
      }
      for (const key of changed) {
        for (const { when, force } of constraints) {
          if (when[0] === key && when[1] === values[key]) {
            values[force[0]] = force[1]
          }
        }
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
    params.set(key, String(enabled))
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
