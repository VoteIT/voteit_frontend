<template>
  <v-btn size="small" color="primary" :to="to" @click="goTo">
    <v-icon icon="mdi-printer" />
  </v-btn>
</template>

<script lang="ts" setup>
import { computed, PropType, ref } from 'vue'

import useAgendaItem from '../agendas/useAgendaItem'
import { Proposal } from '../proposals/types'

import usePrinting from './usePrinting'

const { backOnPrinted } = usePrinting()

const props = defineProps({
  proposal: {
    type: Object as PropType<Proposal>,
    required: true
  }
})

const { agendaItemPath } = useAgendaItem(ref(props.proposal.agenda_item))
const to = computed(() => `${agendaItemPath.value}/print/${props.proposal.pk}`)

function goTo () {
  backOnPrinted.value = true
}
</script>
