import { computed, MaybeRef, unref } from 'vue'

import useProposalStore from './useProposalStore'

export default function useTextDocuments(agendaItem?: MaybeRef<number>) {
  const { getAiDocuments } = useProposalStore()

  const aiProposalTexts = computed(() => {
    const ai = unref(agendaItem)
    if (!ai) return []
    return getAiDocuments(ai)
  })

  return {
    aiProposalTexts
  }
}
