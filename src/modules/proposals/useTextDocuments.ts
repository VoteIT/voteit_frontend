import { filter } from 'itertools'
import { computed, MaybeRef, reactive, readonly, unref } from 'vue'

import { ProposalText, proposalTextType } from './contentTypes'

const proposalTexts = reactive<Map<number, ProposalText>>(new Map())

proposalTextType.updateMap(proposalTexts, { agenda_item: 'agenda_item' })

type DocFilter = (document: ProposalText) => boolean

function getDocuments(_filter: DocFilter) {
  return filter(proposalTexts.values(), _filter)
}

function getParagraph(pk: number) {
  for (const document of proposalTexts.values()) {
    for (const paragraph of document.paragraphs) {
      if (paragraph.pk === pk) return paragraph
    }
  }
}

export default function useTextDocuments(agendaItem?: MaybeRef<number>) {
  const aiProposalTexts = computed(() => {
    const ai = unref(agendaItem)
    if (!ai) return []
    return getDocuments((doc) => doc.agenda_item === ai)
  })

  return {
    proposalTexts: readonly(proposalTexts),
    aiProposalTexts,
    api: proposalTextType.api,
    getDocuments,
    getParagraph
  }
}
