import { computed, MaybeRef, unref } from 'vue'

import useProposalStore from './useProposalStore'

export default function useTextDocuments(agendaItem?: MaybeRef<number>) {
  const { getDocuments } = useProposalStore()

  const aiProposalTexts = computed(() => {
    const ai = unref(agendaItem)
    if (!ai) return []
    return getDocuments((doc) => doc.agenda_item === ai)
  })

  return {
    aiProposalTexts
  }
}
