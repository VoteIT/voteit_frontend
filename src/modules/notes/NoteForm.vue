<script setup lang="ts">
import { computed, watch } from 'vue'

import { stripHTML } from '@/utils'
import RichtextEditor from '@/components/RichtextEditor.vue'

import { IProposalNote, ProposalIntent } from './types'

type NoteData = Pick<IProposalNote, 'body' | 'intent'>

const model = defineModel<NoteData>({ required: true })
const modified = defineModel<boolean>('modified')
const valid = defineModel<boolean>('valid')

const initial = { ...model.value }

// Each field write sends the parent a new object
const intent = computed({
  get: () => model.value.intent,
  set: (intent) => (model.value = { ...model.value, intent })
})
const body = computed({
  get: () => model.value.body,
  set: (body) => (model.value = { ...model.value, body })
})

watch(
  model,
  ({ body, intent }) => {
    modified.value = body !== initial.body || intent !== initial.intent
    valid.value = !!intent || !!stripHTML(body)
  },
  { immediate: true }
)
</script>

<template>
  <div>
    <v-btn-toggle
      class="mb-1"
      density="comfortable"
      mandatory
      v-model="intent"
    >
      <v-btn color="secondary" icon="mdi-text" :value="ProposalIntent.BLANK" />
      <v-btn
        color="success"
        icon="mdi-thumb-up"
        :value="ProposalIntent.APPROVE"
      />
      <v-btn
        color="warning"
        icon="mdi-thumb-down"
        :value="ProposalIntent.DENY"
      />
    </v-btn-toggle>
    <RichtextEditor
      :placeholder="$t('notes.bodyPlaceholder')"
      v-model="body"
    />
  </div>
</template>
