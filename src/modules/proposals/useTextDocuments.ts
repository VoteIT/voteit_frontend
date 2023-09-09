import { filter } from 'itertools'
import { computed, reactive, readonly, Ref } from 'vue'

import { ProposalText, proposalTextType } from './contentTypes'

const proposalTexts = reactive<Map<number, ProposalText>>(new Map())

proposalTextType.updateMap(
  proposalTexts,
  { agenda_item: 'agenda_item' }
)

type DocFilter = (document: ProposalText) => boolean

function getDocuments (_filter: DocFilter) {
  return readonly(filter(proposalTexts.values(), _filter))
}

function getParagraph (pk: number) {
  for (const document of proposalTexts.values()) {
    for (const paragraph of document.paragraphs) {
      if (paragraph.pk === pk) return paragraph
    }
  }
}

export default function useTextDocuments (agendaItem?: Ref<number>) {
  const aiProposalTexts = computed(() => {
    if (!agendaItem?.value) return []
    return getDocuments(doc => doc.agenda_item === agendaItem.value)
  })

  return {
    proposalTexts: readonly(proposalTexts),
    aiProposalTexts,
    api: proposalTextType.api,
    getDocuments,
    getParagraph
  }
}
