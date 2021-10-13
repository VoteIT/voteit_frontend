import { reactive, readonly } from 'vue'

import { ProposalText, proposalTextType } from './contentTypes'

const proposalTexts = reactive<Map<number, ProposalText>>(new Map())

proposalTextType.channelUpdateMap(proposalTexts)

type DocFilter = (document: ProposalText) => boolean

function * iterDocuments (filter: DocFilter): Generator<ProposalText, void> {
  for (const doc of proposalTexts.values()) {
    if (filter(doc)) yield doc
  }
}

function getDocuments (filter: DocFilter) {
  return readonly([...iterDocuments(filter)])
}

export default function useTextDocuments () {
  return {
    proposalTexts: readonly(proposalTexts),
    api: proposalTextType.api,
    getDocuments
  }
}
