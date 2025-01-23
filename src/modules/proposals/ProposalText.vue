<script setup lang="ts">
import Richtext from '@/components/Richtext.vue'
import { Proposal, isDiffProposal, isRichtextProposal } from './types'
import DefaultDialog from '@/components/DefaultDialog.vue'
import { inject } from 'vue'
import { ReadonlyViewKey } from '@/injectionKeys'

defineProps<{
  proposal: Proposal
}>()

const readonlyView = inject(ReadonlyViewKey, false)
</script>

<template>
  <Richtext v-if="isRichtextProposal(proposal)" :value="proposal.body" />
  <div
    v-else-if="isDiffProposal(proposal)"
    class="proposal-text-paragraph d-flex ga-2"
  >
    <div v-html="proposal.body_diff_brief"></div>
    <DefaultDialog
      v-if="!readonlyView"
      :title="$t('proposal.fullProposalText')"
    >
      <template #activator="{ props }">
        <v-icon
          class="cursor-pointer"
          color="primary"
          icon="mdi-arrow-expand"
          size="small"
          v-bind="props"
        />
      </template>
      <p>
        {{ proposal.body }}
      </p>
    </DefaultDialog>
  </div>
</template>
