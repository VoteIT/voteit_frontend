<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  allowedModels: string[]
  onPresentation?: boolean
  onVote?: boolean
  voteTemplate?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:allowedModels', data: string[]): void
  (e: 'update:onPresentation', data: boolean): void
  (e: 'update:onVote', data: boolean): void
  (e: 'update:voteTemplate', data: boolean): void
}>()

function setAllowedModel(model: string, value: boolean) {
  const allowed = value
    ? [...props.allowedModels, model]
    : props.allowedModels.filter((m) => m !== model)
  emit('update:allowedModels', allowed)
}

const onDiscussions = computed({
  get() {
    return props.allowedModels.includes('discussion_post')
  },
  set(value) {
    setAllowedModel('discussion_post', value)
  }
})
const onProposals = computed({
  get() {
    return props.allowedModels.includes('proposal')
  },
  set(value) {
    setAllowedModel('proposal', value)
  }
})
</script>

<template>
  <div class="mb-4">
    <label>{{ $t('reaction.displayOn') }}</label>
    <div class="d-flex flex-wrap">
      <v-checkbox
        v-model="onProposals"
        :label="$t('proposal.proposal')"
        density="compact"
        hide-details
        class="flex-grow-0 mr-8"
      />
      <v-checkbox
        :modelValue="onProposals && onPresentation"
        :disabled="!onProposals"
        @update:modelValue="emit('update:onPresentation', $event!)"
        :label="$t('reaction.onPresentation')"
        density="compact"
        hide-details
        class="flex-grow-0 mr-1"
      />
      <v-checkbox
        :modelValue="onProposals && onVote"
        :disabled="!onProposals"
        @update:modelValue="emit('update:onVote', $event!)"
        :label="$t('reaction.onPoll')"
        density="compact"
        hide-details
        class="flex-grow-0 mr-1"
      />
      <v-checkbox
        :modelValue="onProposals && voteTemplate"
        :disabled="!onProposals"
        @update:modelValue="emit('update:voteTemplate', $event!)"
        :label="$t('reaction.voteTemplate')"
        density="compact"
        hide-details
        class="flex-grow-0 mr-1"
      />
    </div>
    <div>
      <v-checkbox
        v-model="onDiscussions"
        :label="$t('discussion.discussions')"
        density="compact"
        hide-details
        class="flex-grow-0"
      />
    </div>
  </div>
</template>
