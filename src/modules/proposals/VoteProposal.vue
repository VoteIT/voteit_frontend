<script setup lang="ts">
import { inject } from 'vue'

import ProposalCard from './ProposalCard.vue'
import type { Proposal as IProposal } from './types'
import ButtonPlugins from './ButtonPlugins.vue'

const buttonMode = inject('buttonMode', 'vote')

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
      <ButtonPlugins :proposal="proposal" :mode="buttonMode" />
    </template>
  </ProposalCard>
</template>
