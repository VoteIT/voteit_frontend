<script setup lang="ts">
import Proposal from './Proposal.vue'
import type { Proposal as IProposal } from './types'
import ButtonPlugins from './ButtonPlugins.vue'

defineProps<{
  proposal: IProposal
}>()
</script>

<template>
  <Proposal :p="proposal" read-only>
    <template #vote>
      <slot name="vote"></slot>
    </template>
    <template #actions>
      <ButtonPlugins :proposal="proposal" mode="vote" class="mt-2" />
    </template>
  </Proposal>
</template>
