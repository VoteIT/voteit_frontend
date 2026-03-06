<script setup lang="ts">
import { shallowReactive, watch } from 'vue'

import { stripHTML } from '@/utils'
import RichtextEditor from '@/components/RichtextEditor.vue'

import { IProposalNote, ProposalIntent } from './types'

const props = defineProps<{
  modelValue: Pick<IProposalNote, 'body' | 'intent'>
  modified?: boolean
  valid?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Pick<IProposalNote, 'body' | 'intent'>): void
  (e: 'update:modified', value: boolean): void
  (e: 'update:valid', value: boolean): void
}>()

const form = shallowReactive(props.modelValue)

watch(
  form,
  (value) => {
    emit('update:modelValue', value)
    emit(
      'update:modified',
      value.body !== props.modelValue.body ||
        value.intent !== props.modelValue.intent
    )
    emit('update:valid', !!value.intent || !!stripHTML(value.body))
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
