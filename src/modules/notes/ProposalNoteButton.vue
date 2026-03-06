<script setup lang="ts">
import { computed, shallowReactive, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import Richtext from '@/components/Richtext.vue'
import useErrorHandler from '@/composables/useErrorHandler'
import QueryDialog from '@/components/QueryDialog.vue'
import { Proposal, ProposalButtonMode } from '../proposals/types'

import useNotesStore from './useNotesStore'
import { IProposalNote, ProposalIntent } from './types'
import { noteType } from './contentTypes'
import NoteForm from './NoteForm.vue'

const props = defineProps<{
  mode?: ProposalButtonMode
  proposal: Proposal
}>()

const { t } = useI18n()
const store = useNotesStore()
const { handleRestError } = useErrorHandler({ target: 'dialog' })

const proposalNote = computed(() => store.getProposalNote(props.proposal.pk))
const form = shallowReactive({
  data: {
    body: '',
    intent: ProposalIntent.BLANK as IProposalNote['intent']
  },
  editing: false,
  valid: false
})
watch(
  proposalNote,
  (n) => {
    Object.assign(form.data, {
      body: n?.body ?? '',
      intent: n?.intent ?? ProposalIntent.BLANK
    })
  },
  { immediate: true }
)

const badge = computed(() => {
  if (!proposalNote.value) return
  // If in agenda item view, check if intent should be shown
  if (!props.mode && store.hideIntent) {
    return {
      color: 'secondary',
      icon: 'mdi-note'
    }
  }
  switch (proposalNote.value.intent) {
    case ProposalIntent.APPROVE:
      return {
        color: 'success',
        icon: 'mdi-thumb-up'
      }
    case ProposalIntent.BLANK:
      return {
        color: 'secondary',
        icon: 'mdi-text'
      }
    case ProposalIntent.DENY:
      return {
        color: 'warning',
        icon: 'mdi-thumb-down'
      }
  }
})

const intentText = computed(() => {
  switch (form.data.intent) {
    case ProposalIntent.APPROVE:
      return t('notes.intentApprove')
    case ProposalIntent.BLANK:
      // Do not display if in vote mode
      return props.mode === 'vote' ? undefined : t('notes.intentBlank')
    case ProposalIntent.DENY:
      return t('notes.intentDeny')
  }
})

async function saveNote() {
  const { body, intent } = form.data
  if (proposalNote.value)
    await noteType.api.patch(proposalNote.value.pk, form.data)
  else await noteType.api.add({ body, intent, proposal: props.proposal.pk })
  form.editing = false
}

function cancelEdit() {
  Object.assign(form, {
    body: proposalNote.value?.body ?? '',
    editing: false,
    intent: proposalNote.value?.intent ?? ProposalIntent.BLANK
  })
  menuOpen.value = false
}

const clearing = shallowRef(false)
const menuOpen = shallowRef(false)
async function clearNote() {
  if (!proposalNote.value) throw new Error('No proposal note to clear')
  clearing.value = true
  try {
    await noteType.api.delete(proposalNote.value.pk)
    cancelEdit()
  } catch (e) {
    handleRestError(e)
  }
  clearing.value = false
}

// Only editable in normal proposal display (on agenda item)
const isEditable = computed(() => !props.mode)

// Only display in normal proposal display or voting if there's a note
const isVisible = computed(
  () => !props.mode || (proposalNote.value && props.mode === 'vote')
)
</script>

<template>
  <v-badge v-if="isVisible" :model-value="!!badge" v-bind="badge">
    <v-menu v-model="menuOpen">
      <template #activator="{ props }">
        <v-btn variant="tonal" v-bind="props">
          <v-icon v-if="isEditable" icon="mdi-note-edit" />
          <v-icon v-else icon="mdi-note" />
        </v-btn>
      </template>
      <v-card
        v-if="proposalNote && !form.editing"
        max-width="360"
        :ripple="false"
        :subtitle="intentText"
        :title="$t('notes.personal')"
        @click.stop
      >
        <template v-if="proposalNote.body" #text>
          <Richtext :value="proposalNote.body" />
        </template>
        <template v-if="isEditable" #actions>
          <v-spacer />
          <v-btn :text="$t('edit')" @click="form.editing = true" />
          <QueryDialog
            color="warning"
            :text="$t('notes.confirmDelete')"
            @confirmed="clearNote"
          >
            <template #activator="{ props }">
              <v-btn
                color="warning"
                :loading="clearing"
                :text="$t('content.delete')"
                variant="flat"
                v-bind="props"
              />
            </template>
          </QueryDialog>
        </template>
      </v-card>
      <v-card
        v-else
        max-width="360"
        :ripple="false"
        :subtitle="intentText"
        :title="$t('notes.personal')"
        @click.stop
      >
        <template #text>
          <NoteForm v-model="form.data" v-model:valid="form.valid" />
        </template>
        <template #actions>
          <v-spacer />
          <v-btn :text="$t('cancel')" @click="cancelEdit" />
          <v-btn
            color="primary"
            :disabled="!form.valid"
            :text="$t('save')"
            variant="flat"
            @click="saveNote"
          />
        </template>
      </v-card>
    </v-menu>
  </v-badge>
</template>
