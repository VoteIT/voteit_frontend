<script lang="ts" setup>
import { ref, shallowRef, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDropZone } from '@vueuse/core'

import { stripHTML } from '@/utils'
import useErrorHandler from '@/composables/useErrorHandler'

import useAgenda from '../agendas/useAgenda'
import useMeetingId from '../meetings/useMeetingId'

import { meetingDataType } from './contentTypes'
import type { PreviewResponse } from './types'
import useExportImport from './useExportImport'

const { t } = useI18n()
const meetingId = useMeetingId()
const { handleRestError } = useErrorHandler({ target: 'dialog' })
const { agenda } = useAgenda(meetingId)

const { optionsFor, valuesFor, selectionModel } = useExportImport(t)

const clearOptions = optionsFor('clear')
const clearSelected = selectionModel('clear')
const includeOptions = optionsFor('include')
const includeSelected = selectionModel('include')
const importSelected = selectionModel('import')

const hasExistingItems = computed(() => agenda.value.length > 0)

const file = ref<File | null>(null)
const previewResult = ref<PreviewResponse | null>(null)
const importDone = ref(false)
const working = ref(false)

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
  previewResult.value = null
  importDone.value = false
}

watch(file, (f) => {
  if (f) runPreview()
})

async function previewYamlImport(meeting: number, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await meetingDataType.api.action<PreviewResponse>(
    'preview',
    meeting,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
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
  const { data } = await meetingDataType.api.put(meeting, formData as any, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

async function runPreview() {
  if (!file.value) return
  working.value = true
  try {
    previewResult.value = await previewYamlImport(meetingId.value, file.value)
  } catch (e) {
    handleRestError(e)
    file.value = null
  }
  working.value = false
}

async function runImport() {
  if (!file.value) return
  working.value = true
  try {
    await confirmYamlImport(
      meetingId.value,
      file.value,
      valuesFor('clear', 'import', 'include')
    )
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
      />

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
.drop-zone
  border: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity))
  transition: border-color 0.15s, background-color 0.15s

  &--active
    border-color: rgb(var(--v-theme-primary))
    background-color: rgba(var(--v-theme-primary), 0.08)
</style>
