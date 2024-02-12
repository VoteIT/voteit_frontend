<script setup lang="ts">
import Richtext from '@/components/Richtext.vue'
import { Proposal, isDiffProposal, isRichtextProposal } from './types'

defineProps<{
  proposal: Proposal
}>()
</script>

<template>
  <Richtext v-if="isRichtextProposal(proposal)" :object="proposal" />
  <div
    v-else-if="isDiffProposal(proposal)"
    v-html="proposal.body_diff_brief"
    class="proposal-text-paragraph"
  ></div>
</template>
