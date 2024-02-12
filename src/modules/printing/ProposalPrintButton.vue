<template>
  <v-btn v-if="!mode" size="small" color="primary" :to="to" @click="goTo">
    <v-icon icon="mdi-printer" />
  </v-btn>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

import useAgendaItem from '../agendas/useAgendaItem'
import { Proposal, ProposalButtonMode } from '../proposals/types'

import usePrinting from './usePrinting'

const { backOnPrinted } = usePrinting()

const props = defineProps<{
  mode?: ProposalButtonMode
  proposal: Proposal
}>()

const { getAgendaItemRoute } = useAgendaItem(ref(props.proposal.agenda_item))
const to = computed(() =>
  getAgendaItemRoute('printing:proposals', { propIds: props.proposal.pk })
)

function goTo() {
  backOnPrinted.value = true
}
</script>
