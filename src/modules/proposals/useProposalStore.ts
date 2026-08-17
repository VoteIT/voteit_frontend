import { any, Primitive, sorted } from 'itertools'
import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

import { countMatching } from '@/utils'
import IndexedMap from '@/utils/IndexedMap'
import { Predicate } from '@/utils/types'
import useAgendaStore from '../agendas/useAgendaStore'
import { agendaDeletedEvent } from '../agendas/events'
import { onMeetingChannelLeave } from '../meetings/channels'

import { Proposal } from './types'
import { ProposalText, proposalTextType, proposalType } from './contentTypes'

export default defineStore('proposals', () => {
  // Only indexed by agenda item: a user is subscribed to one meeting at a time,
  // so an index on `m` would hold a single key covering every proposal — no
  // narrower than a full scan, but with a Map.get per item on top.
  const proposals = shallowReactive(
    new IndexedMap<Proposal, 'agenda_item'>({
      agenda_item: (p) => p.agenda_item
    })
  )
  const proposalTexts = shallowReactive(
    new IndexedMap<ProposalText, 'agenda_item' | 'paragraph'>({
      agenda_item: (d) => d.agenda_item,
      paragraph: (d) => d.paragraphs.map((p) => p.pk)
    })
  )

  proposalType.updateMap(proposals, { participants: 'm', moderators: 'm' })
  proposalTextType.updateMap(proposalTexts, { agenda_item: 'agenda_item' })

  // Automatically clear proposals for meeting when leaving.
  onMeetingChannelLeave((meeting) => {
    for (const p of proposals.values()) {
      const ai = useAgendaStore().getAgendaItem(p.agenda_item)
      if (ai?.meeting === meeting) {
        proposals.delete(p.pk)
      }
    }
  })

  /* Make sure proposals for agenda item are cleaned up on "deletion" (private). */
  agendaDeletedEvent.on((pk) => {
    // by() materialises, so deleting while looping is safe
    for (const proposal of proposals.by('agenda_item', pk))
      proposals.delete(proposal.pk)
  })

  function* iterProposals(predicate?: Predicate<Proposal>) {
    for (const p of proposals.values()) if (!predicate || predicate(p)) yield p
  }

  function* iterAiProposals(
    agendaItem: number,
    predicate?: Predicate<Proposal>
  ) {
    for (const p of proposals.iterBy('agenda_item', agendaItem))
      if (!predicate || predicate(p)) yield p
  }

  /**
   * Scan every proposal. Only for predicates that no index can serve — prefer
   * the agenda-item lookups below whenever the agenda item is known.
   */
  function filterProposals(
    predicate: Predicate<Proposal>,
    keyFn: (prop: Proposal) => Primitive = (p) => p.created,
    reverse = false
  ) {
    return sorted(iterProposals(predicate), keyFn, reverse)
  }

  /* Index-backed lookups. Prefer these whenever the agenda item or meeting is
   * known — they only touch that key's proposals, so unrelated updates elsewhere
   * in the meeting don't invalidate the caller. */

  function getAiProposals(
    agendaItem: number,
    predicate?: Predicate<Proposal>,
    keyFn: (prop: Proposal) => Primitive = (p) => p.created,
    reverse = false
  ) {
    return sorted(iterAiProposals(agendaItem, predicate), keyFn, reverse)
  }

  function countAiProposals(
    agendaItem: number,
    predicate?: Predicate<Proposal>
  ) {
    return countMatching(
      proposals.iterBy('agenda_item', agendaItem),
      predicate ?? (() => true)
    )
  }

  function anyAiProposal(
    agendaItem: number,
    predicate?: Predicate<Proposal>
  ): boolean {
    return any(iterAiProposals(agendaItem, predicate))
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

  /**
   * Does this agenda item have any text document?
   */
  function anyAiDocument(agendaItem: number) {
    return any(proposalTexts.iterBy('agenda_item', agendaItem))
  }

  /**
   * Get the text documents of an agenda item
   */
  function getAiDocuments(agendaItem: number) {
    return proposalTexts.by('agenda_item', agendaItem)
  }

  /**
   * Get document paragraph by primary key
   */
  function getParagraph(pk: number) {
    for (const document of proposalTexts.iterBy('paragraph', pk))
      for (const paragraph of document.paragraphs)
        if (paragraph.pk === pk) return paragraph
  }

  return {
    anyAiDocument,
    anyAiProposal,
    countAiProposals,
    filterProposals,
    getAiDocuments,
    getAiProposals,
    getParagraph,
    getProposal,
    getProposals
  }
})
