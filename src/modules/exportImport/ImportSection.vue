<script lang="ts" setup>
import { ref, shallowRef, computed, watch } from 'vue'
import { useDropZone } from '@vueuse/core'

import useErrorHandler from '@/composables/useErrorHandler'
import useAgenda from '@/modules/agendas/useAgenda'
import useMeetingId from '../meetings/useMeetingId'
import { meetingDataType } from './contentTypes'
import { MeetingState } from '../meetings/types'
import { stripHTML } from '@/utils'

interface IPreviewResponse {
  groups?: {
    title: string
    groupid: string
  }[]
  agenda_items?: {
    body: string
    title: string
    state?: MeetingState
    proposals?: {
      meeting_group: string
      body: string
    }[]
  }[]
  signature_valid: boolean
  size_limit: number
}

const meetingId = useMeetingId()
const { handleRestError } = useErrorHandler({ target: 'dialog' })
const { agenda } = useAgenda(meetingId)

const hasExistingItems = computed(() => agenda.value.length > 0)

const file = ref<File | null>(null)
const previewResult = ref<IPreviewResponse | null>(null)
const importDone = ref(false)
const working = ref(false)

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
  const { data } = await meetingDataType.api.action<IPreviewResponse>(
    'preview',
    meeting,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  )
  return data
}

async function confirmYamlImport(meeting: number, file: File) {
  const formData = new FormData()
  formData.append('file', file)
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
    await confirmYamlImport(meetingId.value, file.value)
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
      <h3 class="mb-3">{{ $t('exportImport.previewTitle') }}</h3>
      <v-list class="mb-3" rounded>
        <v-list-group value="groups">
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-account-group"
              :title="`${$t('exportImport.groups')} (${
                previewResult.groups?.length ?? 0
              })`"
            />
          </template>
          <v-list-item
            v-for="group in previewResult.groups ?? []"
            :key="group.groupid"
            :title="group.title"
            :subtitle="group.groupid"
          />
        </v-list-group>

        <v-list-group value="agenda_items">
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-format-list-numbered"
              :title="`${$t('exportImport.agendaItems')} (${
                previewResult.agenda_items?.length ?? 0
              })`"
            />
          </template>
          <template
            v-for="(item, i) in previewResult.agenda_items ?? []"
            :key="i"
          >
            <v-list-group v-if="item.proposals?.length" :value="`item-${i}`">
              <template #activator="{ props }">
                <v-list-item
                  v-bind="props"
                  :title="item.title"
                  :subtitle="
                    $t('exportImport.proposalCount', {
                      count: item.proposals.length
                    })
                  "
                />
              </template>
              <v-list-item
                v-for="(proposal, j) in item.proposals"
                :key="j"
                :title="stripHTML(proposal.body)"
                base-color="secondary"
              />
            </v-list-group>
            <v-list-item v-else :title="item.title" />
          </template>
        </v-list-group>
      </v-list>
      <div class="text-right">
        <v-btn
          variant="text"
          :text="$t('exportImport.back')"
          :disabled="working"
          @click="reset"
        />
        <v-btn
          color="primary"
          :loading="working"
          :text="$t('exportImport.confirmImport')"
          @click="runImport"
        />
      </div>
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
