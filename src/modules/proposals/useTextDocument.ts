import { computed, Ref } from 'vue'

import { agendaItems } from '../agendas/useAgenda'

import { ProposalText } from './contentTypes'
import { canAddProposal, canChangeDocument, canDeleteDocument } from './rules'

export default function useTextDocument (doc: Ref<ProposalText>) {
  const agendaItem = computed(() => agendaItems.get(doc.value.agenda_item))
  return {
    canChangeDocument: computed(() => canChangeDocument(doc.value)),
    canDeleteDocument: computed(() => canDeleteDocument(doc.value)),
    canAddProposal: computed(() => agendaItem.value && canAddProposal(agendaItem.value))
  }
}
