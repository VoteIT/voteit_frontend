<script setup lang="ts">
import { useI18n } from 'vue-i18n'


const { t } = useI18n()

const props = defineProps<{
  allowedModels: string[]
  onPresentation: boolean
  onVote: boolean
}>()

const emit = defineEmits<{
  (e: 'update:allowedModels', data: string[]): void
  (e: 'update:onPresentation', data: boolean): void
  (e: 'update:onVote', data: boolean): void
}>()

function setAllowedModel (model: string, value: boolean) {
  const allowed = value
    ? [ ...props.allowedModels, model ]
    : props.allowedModels.filter(m => m !== model)
  emit('update:allowedModels', allowed)
}
</script>

<template>
  <div>
    <label>{{ t('reaction.displayOn') }}</label>
    <div class="mb-4 d-flex flex-wrap">
      <v-checkbox :modelValue="allowedModels.includes('proposal')" @update:modelValue="setAllowedModel('proposal', $event)" :label="t('proposal.proposal')" density="compact" hide-details class="flex-grow-0" />
      <v-checkbox :modelValue="allowedModels.includes('discussion_post')" @update:modelValue="setAllowedModel('discussion_post', $event)" :label="t('discussion.discussions')" density="compact" hide-details class="flex-grow-0" />
      <v-checkbox :modelValue="onPresentation" @update:modelValue="emit('update:onPresentation', $event)" :label="t('reaction.onPresentation')" density="compact" hide-details class="flex-grow-0" />
      <v-checkbox :modelValue="onVote" @update:modelValue="emit('update:onVote', $event)" :label="t('reaction.onPoll')" density="compact" hide-details class="flex-grow-0" />
    </div>
  </div>
</template>
