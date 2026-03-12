<script setup lang="ts">
import { sorted } from 'itertools'
import { computed, shallowReactive, shallowRef, watch } from 'vue'

import { slugify } from '@/utils'
import { cols } from '@/utils/defaults'
import Richtext from '@/components/Richtext.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'

import useAgenda from '../agendas/useAgenda'
import MeetingToolbar from '../meetings/MeetingToolbar.vue'
import useMeeting from '../meetings/useMeeting'
import useProposals from '../proposals/useProposals'
import ProposalSheet from '../proposals/ProposalSheet.vue'

import { noteType } from './contentTypes'
import { IProposalNote, ProposalIntent } from './types'
import NoteForm from './NoteForm.vue'
import useNotesStore from './useNotesStore'

const { meetingId, getMeetingRoute } = useMeeting()
const { agenda } = useAgenda(meetingId)
const { getProposal } = useProposals()
const store = useNotesStore()

const personalNotes = shallowRef<IProposalNote[]>([])

const fetching = shallowRef(false)
async function fetchNotes(meeting: number) {
  fetching.value = true
  try {
    const { data } = await noteType.api.list({ meeting })
    personalNotes.value = data
  } catch {
    alert("Couldn't fetch your notes!")
  }
  fetching.value = false
}

// FIXME in utils?
function getIcon(intent: IProposalNote['intent']) {
  switch (intent) {
    case 'a':
      return ['success', 'mdi-thumb-up']
    case 'd':
      return ['warning', 'mdi-thumb-down']
    default:
      return ['secondary', 'mdi-text']
  }
}

/**
 * Get notes for an agenda item, providing the proposal exists in memory.
 */
function* iterNotes(ai: number) {
  for (const note of personalNotes.value) {
    if (note.agenda_item !== ai) continue
    const proposal = getProposal(note.proposal)
    // Skip if proposal not found, to be safe.
    if (!proposal) continue
    const [color, icon] = getIcon(note.intent)
    yield {
      color,
      icon,
      note,
      proposal
    }
  }
}

/**
 * Agenda items with notes attached.
 */
function* iterAgendaItems() {
  for (const ai of agenda.value) {
    const notes = sorted(iterNotes(ai.pk), (n) => n.proposal.created)
    if (notes.length)
      yield {
        ...ai,
        route: getMeetingRoute('agendaItem', {
          aid: ai.pk,
          aslug: slugify(ai.title)
        }),
        notes
      }
  }
}

const aiPartitioned = computed(() => [...iterAgendaItems()])

watch(meetingId, fetchNotes, { immediate: true })

async function deleteAll() {
  try {
    await noteType.api.listAction('delete-all', { meeting: meetingId.value })
    personalNotes.value = []
  } catch {
    alert('Deleting notes failed')
  }
}

const noteEdit = shallowReactive({
  formData: {
    body: '',
    intent: ProposalIntent.BLANK as IProposalNote['intent']
  },
  modified: false,
  valid: false
})

function setEditNote(note: IProposalNote) {
  Object.assign(noteEdit, {
    formData: {
      body: note.body,
      intent: note.intent
    }
  })
}

async function saveNote(note: number, close: () => void) {
  try {
    const { data } = await noteType.api.patch(note, noteEdit.formData)
    personalNotes.value = [
      ...personalNotes.value.filter((n) => n.pk !== note),
      data
    ]
    close()
  } catch {
    alert('Saving note failed')
  }
}

async function deleteNote(note: number) {
  try {
    await noteType.api.delete(note)
    personalNotes.value = personalNotes.value.filter((n) => n.pk !== note)
  } catch {
    alert('Deleting note failed')
  }
}
</script>

<template>
  <v-row>
    <v-col v-bind="cols.default">
      <MeetingToolbar :title="$t('notes.personal', 2)">
        <v-spacer />
        <div class="d-flex ga-1 mr-2">
          <QueryDialog
            v-if="personalNotes.length"
            color="warning"
            :text="$t('notes.confirmDeleteAll')"
            @confirmed="deleteAll"
          >
            <template #activator="{ props }">
              <v-btn
                color="warning"
                prepend-icon="mdi-delete-sweep"
                :text="$t('notes.deleteAll')"
                v-bind="props"
              />
            </template>
          </QueryDialog>
          <v-menu>
            <template #activator="{ props }">
              <v-btn append-icon="mdi-chevron-down" v-bind="props">
                <v-icon icon="mdi-cog" />
              </v-btn>
            </template>
            <v-card
              max-width="340"
              :ripple="false"
              :title="$t('notes.settings')"
              @click.stop
            >
              <template #text>
                <v-switch
                  color="primary"
                  :hint="$t('notes.hideIntentOnDeviceHint')"
                  :label="$t('notes.hideIntentOnDevice')"
                  persistent-hint
                  v-model="store.hideIntent"
                />
              </template>
            </v-card>
          </v-menu>
        </div>
      </MeetingToolbar>
      <v-alert
        icon="mdi-incognito"
        :text="$t('notes.personalDescription')"
        :title="$t('notes.personal')"
        type="info"
      />
      <div v-if="fetching" class="mt-6 text-center">
        <v-progress-circular indeterminate />
      </div>
      <v-alert
        v-else-if="!aiPartitioned.length"
        class="mt-6"
        :text="$t('notes.noNotesDescription')"
      />
      <template v-for="{ route, notes, title } in aiPartitioned">
        <div class="d-flex mt-6">
          <h2 class="mb-1 flex-grow-1 text-truncate">{{ title }}</h2>
          <v-btn
            class="d-none d-sm-flex"
            append-icon="mdi-chevron-right"
            size="small"
            text="Till dagordningspunkt"
            :to="route"
            variant="tonal"
          />
          <v-btn class="d-sm-none" size="small" :to="route" variant="tonal">
            <v-icon icon="mdi-chevron-right" />
          </v-btn>
        </div>
        <div class="d-flex flex-column ga-2">
          <ProposalSheet
            v-for="{ color, icon, note, proposal } in notes"
            :proposal="proposal"
          >
            <template #append>
              <v-badge class="mt-2 w-100 mb-1" :color="color" :icon="icon">
                <v-sheet border class="w-100 pa-2 text-secondary" rounded>
                  <Richtext v-if="note.body" :value="note.body" />
                  <p v-else class="text-grey">
                    <em>{{ $t('notes.noText') }}</em>
                  </p>
                </v-sheet>
              </v-badge>
              <div class="d-flex justify-end ga-1">
                <v-defaults-provider
                  :defaults="{ VBtn: { size: 'small', variant: 'tonal' } }"
                >
                  <DefaultDialog
                    :title="$t('notes.edit')"
                    @open="setEditNote(note)"
                  >
                    <template #activator="{ props }">
                      <v-btn
                        prepend-icon="mdi-pencil"
                        :text="$t('edit')"
                        v-bind="props"
                      />
                    </template>
                    <template #default="{ close }">
                      <NoteForm
                        class="mb-3"
                        v-model="noteEdit.formData"
                        v-model:modified="noteEdit.modified"
                        v-model:valid="noteEdit.valid"
                      />
                      <div class="text-right">
                        <v-btn
                          :text="$t('cancel')"
                          variant="text"
                          @click="close"
                        />
                        <v-btn
                          color="primary"
                          :text="$t('save')"
                          @click="saveNote(note.pk, close)"
                        />
                      </div>
                    </template>
                  </DefaultDialog>
                  <QueryDialog
                    color="warning"
                    :text="$t('notes.confirmDelete')"
                    @confirmed="deleteNote(note.pk)"
                  >
                    <template #activator="{ props }">
                      <v-btn
                        color="warning"
                        prepend-icon="mdi-delete"
                        :text="$t('content.delete')"
                        v-bind="props"
                      />
                    </template>
                  </QueryDialog>
                </v-defaults-provider>
              </div>
            </template>
          </ProposalSheet>
        </div>
      </template>
    </v-col>
  </v-row>
</template>
