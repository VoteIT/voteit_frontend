import { computed, Ref } from 'vue'

import useAgendaStore from '../agendas/useAgendaStore'

import { ProposalText } from './contentTypes'
import { canAddProposal, canChangeDocument, canDeleteDocument } from './rules'

export default function useTextDocument(doc: Ref<ProposalText>) {
  const { getAgendaItem } = useAgendaStore()

  const agendaItem = computed(() => getAgendaItem(doc.value.agenda_item))
  return {
    canChangeDocument: computed(() => canChangeDocument(doc.value)),
    canDeleteDocument: computed(() => canDeleteDocument(doc.value)),
    canAddProposal: computed(
      () => agendaItem.value && canAddProposal(agendaItem.value)
    )
  }
}
