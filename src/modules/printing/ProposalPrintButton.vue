<template>
  <v-btn v-if="!mode" size="small" color="primary" :to="to" @click="goTo">
    <v-icon icon="mdi-printer" />
  </v-btn>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import { Proposal, ProposalButtonMode } from '../proposals/types'

import usePrinting from './usePrinting'

const { backOnPrinted } = usePrinting()

const props = defineProps<{
  mode?: ProposalButtonMode
  proposal: Proposal
}>()

const to = computed(() => ({
  name: 'printing:proposals',
  params: { propIds: props.proposal.pk }
}))

function goTo() {
  backOnPrinted.value = true
}
</script>
