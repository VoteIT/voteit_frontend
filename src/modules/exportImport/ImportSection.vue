<script lang="ts" setup>
import { ref, shallowRef, computed, onMounted, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDropZone } from '@vueuse/core'

import { stripHTML } from '@/utils'
import useErrorHandler from '@/composables/useErrorHandler'

import useAgenda from '../agendas/useAgenda'
import { meetingType } from '../meetings/contentTypes'
import type { Meeting } from '../meetings/types'
import useMeetingId from '../meetings/useMeetingId'
import useMeetingGroups from '../meetings/useMeetingGroups'
import useMeetingStore from '../meetings/useMeetingStore'
import useProposalStore from '../proposals/useProposalStore'
import useReactionStore from '../reactions/useReactionStore'

import { meetingDataType } from './contentTypes'
import type { PreviewResponse } from './types'
import useExportImport from './useExportImport'

const { t } = useI18n()
const meetingId = useMeetingId()
const { handleRestError } = useErrorHandler({ target: 'dialog' })
const { agenda } = useAgenda(meetingId)
const { meetingGroups } = useMeetingGroups(meetingId)
const meetingStore = useMeetingStore()
const proposalStore = useProposalStore()
const reactionStore = useReactionStore()

const { optionsFor, valuesFor, selectionModel, values } = useExportImport(t)

const baseClearOptions = optionsFor('clear')
const baseIncludeOptions = optionsFor('include')
const clearSelected = selectionModel('clear')
const includeSelected = selectionModel('include')
const importSelected = selectionModel('import')
// Default all import options on (e.g. "Add participants").
for (const option of baseIncludeOptions.value) values[option.key] = true

const hasExistingItems = computed(() => agenda.value.length > 0)

const file = ref<File | null>(null)
const previewResult = ref<PreviewResponse | null>(null)
const importDone = ref(false)
const working = ref(false)

/** Subtitle: creation year and translated state, e.g. "2026 · Ongoing". */
function getSubTitle(m: Meeting) {
  const date = m.end_time ?? m.start_time
  const state = meetingType.sm.getState(m.state).translate(t)
  if (!date) return state
  return `${new Date(date).getFullYear()} · ${state}`
}

// Clone source: an existing meeting the user moderates (excluding this one).
const sourceMeetingId = ref<number | null>(null)
const loadingMeetings = ref(false)
const cloneMeetings = computed(() =>
  meetingStore.moderatedMeetings
    .filter((m) => m.pk !== meetingId.value)
    .map((m) => ({
      title: m.title,
      value: m.pk,
      subtitle: getSubTitle(m)
    }))
)

onMounted(async () => {
  loadingMeetings.value = true
  try {
    await meetingStore.fetchMeetings()
  } catch (e) {
    handleRestError(e)
  }
  loadingMeetings.value = false
})

const hasProposals = computed(() =>
  (previewResult.value?.agenda_items ?? []).some(
    (item) => item.proposals.length
  )
)
const hasDiscussions = computed(() =>
  (previewResult.value?.agenda_items ?? []).some(
    (item) => item.discussions.length
  )
)

// Only offer an option when the previewed file actually contains the data it
// acts on. Each select is filtered to its available options (and hidden when
// none apply).
const hasReactions = computed(() =>
  (previewResult.value?.reaction_buttons ?? []).some((b) => b.reactions.length)
)
const hasAuthors = computed(() =>
  (previewResult.value?.agenda_items ?? []).some((item) =>
    [...item.proposals, ...item.discussions].some((c) => c.author)
  )
)
const hasGroupAuthors = computed(() =>
  (previewResult.value?.agenda_items ?? []).some((item) =>
    [...item.proposals, ...item.discussions].some((c) => c.meeting_group)
  )
)
const hasAiStates = computed(() =>
  (previewResult.value?.agenda_items ?? []).some((item) => item.state)
)
const proposals = computed(() =>
  (previewResult.value?.agenda_items ?? []).flatMap((item) => item.proposals)
)
const hasProposalStates = computed(() => proposals.value.some((p) => p.state))
const hasProposalIds = computed(() => proposals.value.some((p) => p.prop_id))

const availableOptionKeys = computed<Set<string>>(() => {
  const p = previewResult.value
  const keys = new Set<string>()
  if (!p) return keys
  if (p.groups.length) keys.add('include_groups')
  if (hasProposals.value) keys.add('include_proposals')
  if (hasDiscussions.value) keys.add('include_discussions')
  if (p.reaction_buttons.length) keys.add('include_buttons')
  if (hasReactions.value) keys.add('include_reactions')
  if (hasProposalStates.value) keys.add('clear_proposal_states')
  if (hasProposalIds.value) keys.add('clear_proposal_id')
  if (hasAuthors.value) keys.add('clear_authors')
  if (hasGroupAuthors.value) keys.add('clear_group_authors')
  if (hasAiStates.value) keys.add('clear_ai_states')
  return keys
})

const clearOptions = computed(() =>
  baseClearOptions.value.filter((o) => availableOptionKeys.value.has(o.key))
)
const includeOptions = computed(() =>
  baseIncludeOptions.value.filter((o) => availableOptionKeys.value.has(o.key))
)

// Display wrappers for the selects: only ever show keys whose option is
// available (otherwise Vuetify renders a chip for a value that has no matching
// item). Writes are delegated to the real model — which applies constraints —
// while any hidden selections are preserved so we don't clobber their values.
function visibleSelection(
  model: Ref<string[]>,
  available: Ref<{ key: string }[]>
) {
  const availableKeys = computed(
    () => new Set(available.value.map((o) => o.key))
  )
  return computed<string[]>({
    get: () => model.value.filter((key) => availableKeys.value.has(key)),
    set: (visibleKeys) => {
      const hidden = model.value.filter((key) => !availableKeys.value.has(key))
      model.value = [...hidden, ...visibleKeys]
    }
  })
}

const clearSelectedVisible = visibleSelection(clearSelected, clearOptions)
const includeSelectedVisible = visibleSelection(includeSelected, includeOptions)

// "Add participants" pulls in proposal/discussion authors, so it's only
// relevant when such content both exists and is being imported — and never
// when authors are being cleared anyway.
const showAddParticipants = computed(
  () =>
    !clearSelected.value.includes('clear_authors') &&
    ((hasProposals.value &&
      includeSelected.value.includes('include_proposals')) ||
      (hasDiscussions.value &&
        includeSelected.value.includes('include_discussions')))
)

// The preview list mirrors exactly what will be imported: each section is
// filtered both by what the file contains and by the selected include options.
const showGroups = computed(() =>
  includeSelected.value.includes('include_groups')
)
const showProposals = computed(() =>
  includeSelected.value.includes('include_proposals')
)
const showDiscussions = computed(() =>
  includeSelected.value.includes('include_discussions')
)
const showButtons = computed(() =>
  includeSelected.value.includes('include_buttons')
)
const showReactions = computed(() =>
  includeSelected.value.includes('include_reactions')
)

const displayedGroups = computed(() =>
  showGroups.value ? previewResult.value?.groups ?? [] : []
)

// Agenda items are always imported; only their proposals/discussions are gated.
const displayedAgendaItems = computed(() =>
  (previewResult.value?.agenda_items ?? []).map((item) => ({
    title: item.title,
    proposals: showProposals.value ? item.proposals : [],
    discussions: showDiscussions.value ? item.discussions : []
  }))
)

// Reaction buttons are gated by include_buttons; their reaction *count* is only
// meaningful when include_reactions is also on (otherwise 0 reactions import).
const displayedReactionButtons = computed(() =>
  showButtons.value
    ? (previewResult.value?.reaction_buttons ?? []).map((button) => ({
        title: button.title,
        icon: button.icon || 'mdi-checkbox-blank',
        reactionCount: showReactions.value ? button.reactions.length : 0
      }))
    : []
)

interface ImportWarning {
  clamp?: boolean
  color: 'warning' | 'info'
  icon: string
  key: string
  subtitle?: string
  title: string
}

function lc(s: string) {
  return s.toLocaleLowerCase()
}

// Surfaces collisions between the file being imported and content that already
// exists in the current meeting. Each category is summarised into a single row:
// a pluralised count in the title and the concerned titles/ids in the subtitle.
// Proposal/button/group cases are gated by the include selection so we only warn
// about what will actually be imported; agenda items are always imported.
const importWarnings = computed<ImportWarning[]>(() => {
  const preview = previewResult.value
  if (!preview) return []
  const warnings: ImportWarning[] = []

  // 1. Agenda items with a matching title
  const existingTitles = new Set(agenda.value.map((ai) => lc(ai.title)))
  const agendaMatches = preview.agenda_items
    .filter((item) => existingTitles.has(lc(item.title)))
    .map((item) => item.title)
  if (agendaMatches.length)
    warnings.push({
      color: 'warning',
      icon: 'mdi-alert',
      key: 'agenda',
      subtitle: agendaMatches.join(', '),
      title: t('exportImport.warnings.agendaItems', agendaMatches.length)
    })

  // 2. Proposals with an identical prop_id
  if (showProposals.value) {
    const existingPropIds = new Set(
      proposalStore
        .filterProposals((p) => p.m === meetingId.value)
        .map((p) => p.prop_id)
    )
    const proposalMatches = preview.agenda_items
      .flatMap((item) => item.proposals)
      .map((proposal) => proposal.prop_id)
      .filter(
        (propId): propId is string => !!propId && existingPropIds.has(propId)
      )
    if (proposalMatches.length)
      warnings.push({
        color: 'warning',
        icon: 'mdi-alert',
        key: 'proposals',
        subtitle: proposalMatches.join(', '),
        title: t('exportImport.warnings.proposalIds', proposalMatches.length)
      })
  }

  // 3. Buttons: same title, but a differing color/target/icon
  if (showButtons.value) {
    const existingButtons = reactionStore.getMeetingButtons(meetingId.value)
    const buttonMatches = preview.reaction_buttons
      .filter((button) => {
        const match = existingButtons.find(
          (b) => lc(b.title) === lc(button.title)
        )
        return (
          !!match &&
          (match.color !== button.color ||
            match.target !== (button.target ?? null) ||
            match.icon !== button.icon)
        )
      })
      .map((button) => button.title)
    if (buttonMatches.length)
      warnings.push({
        color: 'warning',
        icon: 'mdi-alert',
        key: 'buttons',
        subtitle: buttonMatches.join(', '),
        title: t('exportImport.warnings.buttons', buttonMatches.length)
      })
  }

  // 4. Groups that already exist (informational)
  if (showGroups.value) {
    const existingGroupIds = new Set(meetingGroups.value.map((g) => g.groupid))
    const groupMatches = preview.groups
      .filter((group) => existingGroupIds.has(group.groupid))
      .map((group) => group.title)
    if (groupMatches.length) {
      warnings.push({
        clamp: true,
        color: 'info',
        icon: 'mdi-information',
        key: 'groups',
        subtitle: groupMatches.join(', '),
        title: t('exportImport.warnings.groups', groupMatches.length)
      })
    }
  }

  return warnings
})

function itemSubtitle(item: { proposals: unknown[]; discussions: unknown[] }) {
  const parts: string[] = []
  if (item.proposals.length)
    parts.push(
      t('exportImport.proposalCount', { count: item.proposals.length })
    )
  if (item.discussions.length)
    parts.push(
      t('exportImport.discussionCount', { count: item.discussions.length })
    )
  return parts.join(' · ')
}

// File input for click-to-select fallback
const fileInputRef = ref<HTMLInputElement>()
const dropZoneRef = shallowRef<HTMLDivElement>()

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop(files) {
    if (!files?.length) return
    file.value = files[0]
  },
  dataTypes: [
    'application/yaml',
    'application/x-yaml',
    'text/yaml',
    'text/x-yaml',
    'text/plain'
  ],
  multiple: false
})

function openFilePicker() {
  fileInputRef.value?.click()
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  file.value = input.files?.[0] ?? null
  // Reset so the same file can be re-selected
  input.value = ''
}

function reset() {
  file.value = null
  sourceMeetingId.value = null
  previewResult.value = null
  importDone.value = false
}

watch(file, (f) => {
  if (f) runPreview()
})

watch(sourceMeetingId, (id) => {
  if (id !== null) runPreview()
})

// All include_* flags on — the preview always reflects the full source; the
// filtered `includeOptions` only drive what the user can toggle afterwards.
const allIncludeOn = () =>
  Object.fromEntries(baseIncludeOptions.value.map(({ key }) => [key, true]))

const MULTIPART_CONFIG = { headers: { 'Content-Type': 'multipart/form-data' } }

async function previewYamlImport(meeting: number, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('preview', 'true')
  // Request all include data so the preview reflects the full file; the filtered
  // `includeOptions` only drives what the user can toggle afterwards.
  for (const { key } of baseIncludeOptions.value) {
    formData.append(key, 'true')
  }
  const { data } = await meetingDataType.api.action<PreviewResponse>(
    'import',
    meeting,
    formData as any,
    MULTIPART_CONFIG
  )
  return data
}

async function confirmYamlImport(
  meeting: number,
  file: File,
  options: Record<string, boolean>
) {
  const formData = new FormData()
  formData.append('file', file)
  for (const [key, enabled] of Object.entries(options)) {
    formData.append(key, String(enabled))
  }
  const { data } = await meetingDataType.api.action(
    'import',
    meeting,
    formData as any,
    MULTIPART_CONFIG
  )
  return data
}

async function previewClone(meeting: number, source: number) {
  const { data } = await meetingDataType.api.action<PreviewResponse>(
    'clone',
    meeting,
    { source, preview: true, ...allIncludeOn() }
  )
  return data
}

async function confirmClone(
  meeting: number,
  source: number,
  options: Record<string, boolean>
) {
  const { data } = await meetingDataType.api.action('clone', meeting, {
    source,
    ...options
  })
  return data
}

async function runPreview() {
  if (sourceMeetingId.value === null && !file.value) return
  working.value = true
  try {
    previewResult.value =
      sourceMeetingId.value !== null
        ? await previewClone(meetingId.value, sourceMeetingId.value)
        : await previewYamlImport(meetingId.value, file.value!)
  } catch (e) {
    handleRestError(e)
    file.value = null
    sourceMeetingId.value = null
  }
  working.value = false
}

async function runImport() {
  if (sourceMeetingId.value === null && !file.value) return
  working.value = true
  try {
    const options = valuesFor('clear', 'import', 'include')
    if (sourceMeetingId.value !== null)
      await confirmClone(meetingId.value, sourceMeetingId.value, options)
    else await confirmYamlImport(meetingId.value, file.value!, options)
    importDone.value = true
  } catch (e) {
    handleRestError(e)
  }
  working.value = false
}
</script>

<template>
  <div>
    <h2 class="mb-4">{{ $t('exportImport.title') }}</h2>

    <!-- Done state -->
    <template v-if="importDone">
      <v-alert
        type="success"
        :text="$t('exportImport.importSuccess')"
        class="mb-4"
      />
      <v-btn
        variant="text"
        :text="$t('exportImport.importAnother')"
        @click="reset"
      />
    </template>

    <!-- Stage 2: preview result -->
    <template v-else-if="previewResult !== null">
      <v-form @submit.prevent="runImport">
        <v-select
          v-if="includeOptions.length"
          v-model="includeSelectedVisible"
          :items="includeOptions"
          item-title="title"
          item-value="key"
          :label="$t('exportImport.options.includeLabel')"
          multiple
          chips
          closable-chips
        />
        <v-select
          v-if="clearOptions.length"
          v-model="clearSelectedVisible"
          :items="clearOptions"
          item-title="title"
          item-value="key"
          :label="$t('exportImport.options.clearLabel')"
          multiple
          chips
          closable-chips
        />
        <v-checkbox
          v-if="showAddParticipants"
          class="mb-4"
          :label="$t('exportImport.options.addParticipants')"
          :hint="$t('exportImport.options.addParticipantsHint')"
          persistent-hint
          :model-value="importSelected.includes('add_participants')"
          @update:model-value="
            importSelected = $event ? ['add_participants'] : []
          "
        />
        <v-alert
          v-if="importWarnings.length"
          variant="tonal"
          color="warning"
          class="mb-4"
        >
          <v-list
            bg-color="transparent"
            density="compact"
            class="import-warnings"
          >
            <v-list-item
              v-for="warning in importWarnings"
              :class="{ 'no-clamp': !warning.clamp }"
              :key="warning.key"
              :title="warning.title"
              :subtitle="warning.subtitle"
            >
              <template #append>
                <v-icon :icon="warning.icon" :color="warning.color" />
              </template>
            </v-list-item>
          </v-list>
        </v-alert>
        <v-list
          v-if="
            displayedGroups.length ||
            displayedAgendaItems.length ||
            displayedReactionButtons.length
          "
          class="mb-3"
          rounded
        >
          <v-list-subheader
            :title="
              $t('exportImport.importFrom', { title: previewResult.meta.title })
            "
          />
          <v-list-group v-if="displayedGroups.length" value="groups">
            <template #activator="{ props }">
              <v-list-item
                v-bind="props"
                prepend-icon="mdi-account-group"
                :title="`${$t('exportImport.groups')} (${
                  displayedGroups.length
                })`"
              />
            </template>
            <v-list-item
              v-for="group in displayedGroups"
              :key="group.groupid"
              :title="group.title"
              :subtitle="group.groupid"
            />
          </v-list-group>

          <v-list-group v-if="displayedAgendaItems.length" value="agenda_items">
            <template #activator="{ props }">
              <v-list-item
                v-bind="props"
                prepend-icon="mdi-format-list-numbered"
                :title="`${$t('exportImport.agendaItems')} (${
                  displayedAgendaItems.length
                })`"
              />
            </template>
            <template v-for="(item, i) in displayedAgendaItems" :key="i">
              <v-list-group
                v-if="item.proposals.length || item.discussions.length"
                :value="`item-${i}`"
              >
                <template #activator="{ props }">
                  <v-list-item
                    v-bind="props"
                    :title="item.title"
                    :subtitle="itemSubtitle(item)"
                  />
                </template>
                <v-list-item
                  v-for="(proposal, j) in item.proposals"
                  :key="`p-${j}`"
                  :title="stripHTML(proposal.body)"
                  base-color="secondary"
                />
                <v-list-item
                  v-for="(discussion, j) in item.discussions"
                  :key="`d-${j}`"
                  prepend-icon="mdi-comment-outline"
                  :title="stripHTML(discussion.body)"
                  base-color="secondary"
                />
              </v-list-group>
              <v-list-item v-else :title="item.title" />
            </template>
          </v-list-group>

          <v-list-group v-if="displayedReactionButtons.length" value="buttons">
            <template #activator="{ props }">
              <v-list-item
                v-bind="props"
                prepend-icon="mdi-thumb-up-outline"
                :title="`${$t('reaction.buttons')} (${
                  displayedReactionButtons.length
                })`"
              />
            </template>
            <v-list-item
              v-for="(button, i) in displayedReactionButtons"
              :key="i"
              :prepend-icon="button.icon"
              :title="button.title"
              :subtitle="
                button.reactionCount
                  ? $t('exportImport.reactionCount', {
                      count: button.reactionCount
                    })
                  : undefined
              "
            />
          </v-list-group>
        </v-list>
        <div class="text-right">
          <v-btn
            variant="text"
            :text="$t('cancel')"
            :disabled="working"
            @click="reset"
          />
          <v-btn
            color="primary"
            :loading="working"
            :text="$t('exportImport.confirmImport')"
            type="submit"
          />
        </div>
      </v-form>
    </template>

    <!-- Stage 1: file selection -->
    <template v-else>
      <v-alert
        v-if="hasExistingItems"
        class="mb-4"
        type="warning"
        :text="$t('exportImport.agendaItemsWarning')"
        variant="tonal"
      />

      <v-select
        v-if="cloneMeetings.length"
        clearable
        :disabled="working"
        hide-details
        :items="cloneMeetings"
        :label="$t('exportImport.cloneFromMeeting')"
        :loading="loadingMeetings"
        variant="outlined"
        v-model="sourceMeetingId"
      >
        <template #item="{ props, item }">
          <v-list-item v-bind="props" :subtitle="item.raw.subtitle" />
        </template>
      </v-select>

      <div
        v-if="cloneMeetings.length"
        class="text-center text-medium-emphasis my-2"
      >
        – {{ $t('exportImport.cloneOr') }} –
      </div>

      <input
        ref="fileInputRef"
        type="file"
        accept=".yaml,.yml"
        class="d-none"
        @change="onFileSelected"
      />

      <div
        ref="dropZoneRef"
        class="drop-zone mb-4 pa-8 d-flex flex-column align-center justify-center rounded cursor-pointer"
        :class="{ 'drop-zone--active': isOverDropZone }"
        @click="openFilePicker"
      >
        <v-icon icon="mdi-file-upload-outline" size="x-large" class="mb-2" />
        <p class="text-center">{{ $t('exportImport.dropZoneLabel') }}</p>
        <p v-if="file" class="text-body-2 mt-2 font-weight-medium">
          {{ $t('exportImport.selectedFile', { name: file.name }) }}
        </p>
      </div>

      <v-progress-linear
        v-if="working"
        indeterminate
        color="primary"
        class="mt-2"
      />
    </template>
  </div>
</template>

<style lang="sass" scoped>
// Let the summary subtitle wrap so every concerned title stays visible.
.no-clamp :deep(.v-list-item-subtitle)
  -webkit-line-clamp: unset
  white-space: normal

.drop-zone
  border: 2px dashed rgba(var(--v-border-color), .5)
  transition: border-color 0.15s, background-color 0.15s

  &:hover
    border-color: rgba(var(--v-border-color), 1)

  &--active
    border-color: rgba(var(--v-theme-primary), 1)
    background-color: rgba(var(--v-theme-primary), 0.08)
</style>
