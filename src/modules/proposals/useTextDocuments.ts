import { computed, reactive, readonly, Ref } from 'vue'

import { ProposalText, proposalTextType } from './contentTypes'

const proposalTexts = reactive<Map<number, ProposalText>>(new Map())

proposalTextType.updateMap(proposalTexts)

type DocFilter = (document: ProposalText) => boolean

function * iterDocuments (filter: DocFilter): Generator<ProposalText, void> {
  for (const doc of proposalTexts.values()) {
    if (filter(doc)) yield doc
  }
}

function getDocuments (filter: DocFilter) {
  return readonly([...iterDocuments(filter)])
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
