import { any, filter, map, Predicate, Primitive, sorted } from 'itertools'
import { defineStore } from 'pinia'
import { reactive } from 'vue'

import { countMatching } from '@/utils'
import useAgendaStore from '../agendas/useAgendaStore'
import { agendaDeletedEvent } from '../agendas/events'
import { meetingType } from '../meetings/contentTypes'

import { Proposal } from './types'
import { ProposalText, proposalTextType, proposalType } from './contentTypes'

export default defineStore('proposals', () => {
  const proposals = reactive(new Map<number, Proposal>())
  const proposalTexts = reactive(new Map<number, ProposalText>())

  proposalType.updateMap(proposals, { participants: 'm', moderators: 'm' })
  proposalTextType.updateMap(proposalTexts, { agenda_item: 'agenda_item' })

  // Automatically clear proposals for meeting when leaving.
  meetingType.channel.onLeave((meeting) => {
    for (const p of proposals.values()) {
      const ai = useAgendaStore().getAgendaItem(p.agenda_item)
      if (ai?.meeting === meeting) {
        proposals.delete(p.pk)
      }
    }
  })

  /* Make sure proposals for agenda item are cleaned up on "deletion" (private). */
  agendaDeletedEvent.on((pk) => {
    for (const proposal of proposals.values()) {
      if (proposal.agenda_item === pk) proposals.delete(proposal.pk)
    }
  })

  function* iterProposals(predicate?: Predicate<Proposal>) {
    for (const p of proposals.values()) if (!predicate || predicate(p)) yield p
  }

  function countProposals(predicate: Predicate<Proposal>) {
    return countMatching(proposals.values(), predicate)
  }

  function anyProposal(predicate: Predicate<Proposal>): boolean {
    return any(iterProposals(predicate))
  }

  function filterProposals(
    predicate: Predicate<Proposal>,
    keyFn: (prop: Proposal) => Primitive = (p) => p.created,
    reverse = false
  ) {
    return sorted(iterProposals(predicate), keyFn, reverse)
  }

  function forProposals(
    predicate: Predicate<Proposal>,
    fn: (proposal: Proposal) => void
  ) {
    map(iterProposals(predicate), fn)
  }

  function getProposal(pk: number) {
    return proposals.get(pk)
  }

  /**
   * Get proposals from primary keys, in same order.
   */
  function getProposals(pks: number[]) {
    return pks.map(getProposal).filter((p) => !!p)
  }

  // Text documents (diff stuff)

  function anyDocument(predicate: Predicate<ProposalText>) {
    return any(proposalTexts.values(), predicate)
  }

  /**
   * Get a list of documents matching predicate
   */
  function getDocuments(predicate: Predicate<ProposalText>) {
    return filter(proposalTexts.values(), predicate)
  }

  /**
   * Get document paragraph by primary key
   */
  function getParagraph(pk: number) {
    for (const document of proposalTexts.values())
      for (const paragraph of document.paragraphs)
        if (paragraph.pk === pk) return paragraph
  }

  return {
    anyDocument,
    countProposals,
    anyProposal,
    filterProposals,
    forProposals,
    getDocuments,
    getParagraph,
    getProposal,
    getProposals
  }
})
