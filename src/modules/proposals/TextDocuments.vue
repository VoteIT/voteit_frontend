<template>
  <div>
    <TextDocument v-for="doc in documents" :key="doc.pk" :document="doc" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import useAgendaItem from '../agendas/useAgendaItem'

import TextDocument from './TextDocument.vue'
import useProposalStore from './useProposalStore'

const { agendaId } = useAgendaItem()
const { getAiDocuments } = useProposalStore()
const documents = computed(() => getAiDocuments(agendaId.value))
</script>
