<script setup lang="ts">
import ProposalCard from './ProposalCard.vue'
import type { Proposal as IProposal } from './types'
import ButtonPlugins from './ButtonPlugins.vue'

defineProps<{
  proposal: IProposal
}>()
</script>

<template>
  <ProposalCard :p="proposal" read-only>
    <template #vote>
      <slot name="vote"></slot>
    </template>
    <template #actions>
      <ButtonPlugins :proposal="proposal" mode="vote" />
    </template>
  </ProposalCard>
</template>
