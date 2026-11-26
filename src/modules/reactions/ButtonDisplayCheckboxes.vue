<script setup lang="ts">
import { computed } from 'vue'

const allowedModels = defineModel<string[]>('allowedModels', {
  required: true
})
const onPresentation = defineModel<boolean>('onPresentation')
const onVote = defineModel<boolean>('onVote')
const voteTemplate = defineModel<boolean>('voteTemplate')

function setAllowedModel(model: string, value: boolean) {
  allowedModels.value = value
    ? [...allowedModels.value, model]
    : allowedModels.value.filter((m) => m !== model)
}

const onDiscussions = computed({
  get() {
    return allowedModels.value.includes('discussion_post')
  },
  set(value) {
    setAllowedModel('discussion_post', value)
  }
})
const onProposals = computed({
  get() {
    return allowedModels.value.includes('proposal')
  },
  set(value) {
    setAllowedModel('proposal', value)
  }
})
</script>

<template>
  <div class="mb-4">
    <v-label :text="$t('reaction.displayOn')" />
    <div class="d-flex flex-wrap">
      <v-checkbox
        v-model="onProposals"
        :label="$t('proposal.proposal')"
        density="compact"
        hide-details
        class="flex-grow-0 mr-8"
      />
      <v-checkbox
        :model-value="onProposals && onPresentation"
        :disabled="!onProposals"
        @update:model-value="onPresentation = !!$event"
        :label="$t('reaction.onPresentation')"
        density="compact"
        hide-details
        class="flex-grow-0 mr-1"
      />
      <v-checkbox
        :model-value="onProposals && onVote"
        :disabled="!onProposals"
        @update:model-value="onVote = !!$event"
        :label="$t('reaction.onPoll')"
        density="compact"
        hide-details
        class="flex-grow-0 mr-1"
      />
      <v-checkbox
        :model-value="onProposals && voteTemplate"
        :disabled="!onProposals"
        @update:model-value="voteTemplate = !!$event"
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
