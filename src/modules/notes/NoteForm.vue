<script setup lang="ts">
import { shallowReactive, watch } from 'vue'

import { stripHTML } from '@/utils'
import RichtextEditor from '@/components/RichtextEditor.vue'

import { IProposalNote, ProposalIntent } from './types'

const props = defineProps<{
  modelValue: Pick<IProposalNote, 'body' | 'intent'>
}>()

// The note object itself is edited in place, so it can't be a defineModel (same object never emits)
const emit = defineEmits<{
  (e: 'update:modelValue', value: Pick<IProposalNote, 'body' | 'intent'>): void
}>()
const modified = defineModel<boolean>('modified')
const valid = defineModel<boolean>('valid')

const form = shallowReactive(props.modelValue)

watch(
  form,
  (value) => {
    emit('update:modelValue', value)
    modified.value =
      value.body !== props.modelValue.body ||
      value.intent !== props.modelValue.intent
    valid.value = !!value.intent || !!stripHTML(value.body)
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
      v-model="form.intent"
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
      v-model="form.body"
    />
  </div>
</template>
