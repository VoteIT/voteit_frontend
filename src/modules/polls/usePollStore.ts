import {
  any,
  dropwhile,
  filter,
  first,
  ifilter,
  map,
  Predicate
} from 'itertools'
import { defineStore } from 'pinia'
import { computed, shallowReactive } from 'vue'

import { Vote } from '@/contentTypes/types'
import IndexedMap from '@/utils/IndexedMap'
import { agendaDeletedEvent } from '../agendas/events'

import { pollType, voteType } from './contentTypes'
import { pollPlugins } from './registry'
import { canVote } from './rules'
import { Poll, PollState, PollStatus } from './types'
import type { PollStartData } from './methods/types'

export default defineStore('polls', () => {
  // No `meeting` index: only one meeting's polls are ever loaded at a time,
  // so it would degenerate into a single key covering every poll.
  const polls = shallowReactive(
    new IndexedMap<Poll, 'agenda_item' | 'proposal'>({
      agenda_item: (p) => p.agenda_item,
      // One poll is indexed under every proposal it contains
      proposal: (p) => p.proposals
    })
  )
  const userVotes = shallowReactive(
    new IndexedMap<Vote, 'poll'>({ poll: (v) => v.poll })
  )
  const pollStatuses = shallowReactive(new Map<number, PollStatus>())

  pollType
    .updateMap(polls, { participants: 'meeting', moderators: 'meeting' })
    .on<PollStatus>('status', (item) => {
      const existing = pollStatuses.get(item.pk)
      // Throw away statuses with less votes - in case async order wrong
      if (!existing || existing.voted < item.voted) {
        pollStatuses.set(item.pk, item)
      }
    })

  voteType.updateMap(userVotes)

  /*
   ** Clear private polls when agenda item deleted.
   */
  agendaDeletedEvent.on((pk) => {
    // by() materialises, so deleting while looping is safe
    for (const poll of polls.by('agenda_item', pk)) polls.delete(poll.pk)
  })

  /**
   * Used to compute a unique poll title
   */
  const allPollTitles = computed(() => map(polls.values(), (p) => p.title))

  /**
   * Check if any poll matches filter
   */
  function anyPoll(filter: Predicate<Poll>) {
    return any(polls.values(), filter)
  }

  async function createPoll(pollData: PollStartData) {
    const data = await pollType.api.add(pollData)
    polls.set(data.pk, data)
    return data
  }

  /**
   * Get all polls that matches filter
   */
  function filterPolls(predicate: Predicate<Poll>) {
    return filter(polls.values(), predicate)
  }

  function getAiPolls(agendaItem: number, state?: PollState) {
    return filter(
      polls.iterBy('agenda_item', agendaItem),
      (p) => !state || p.state === state
    )
  }

  function getMeetingPolls(meeting: number, state?: PollState) {
    return filterPolls(
      (p) => p.meeting === meeting && (!state || p.state === state)
    )
  }

  function anyAiPoll(agendaItem: number, state?: PollState) {
    return any(
      polls.iterBy('agenda_item', agendaItem),
      (p) => !state || p.state === state
    )
  }

  /**
   * Is the proposal part of any poll?
   */
  function anyPollWithProposal(proposal: number) {
    return any(polls.iterBy('proposal', proposal))
  }

  function getPoll(pk: number) {
    return polls.get(pk)
  }

  /**
   * Get poll method plugin
   */
  function getPollMethod(id: string) {
    return pollPlugins.getPlugin(id)
  }

  /**
   * Get vote count of total (updated frequently)
   */
  function getPollStatus(pk: number) {
    return pollStatuses.get(pk)
  }

  function getUserVote(poll: Poll) {
    return first(userVotes.iterBy('poll', poll.pk))
  }

  /**
   * Is user expected to vote in this poll?
   */
  function isUnvotedPoll(poll: Poll) {
    return (
      poll.state === PollState.Ongoing && canVote(poll) && !getUserVote(poll)
    )
  }

  /**
   * Get first ongoing poll in a meeting that current user hasn't voted in.
   * @param poll If provided, function will return next unvoted poll in order
   */
  function getMeetingUnvotedPredicate(meeting: number): Predicate<Poll> {
    return (poll: Poll) => poll.meeting === meeting && isUnvotedPoll(poll)
  }

  function getNextUnvotedPoll(meeting: number, poll?: Poll) {
    const isUnvoted = getMeetingUnvotedPredicate(meeting)
    if (poll) {
      const isOther = ({ pk }: Poll) => pk !== poll.pk
      for (const p of ifilter(dropwhile(polls.values(), isOther), isUnvoted))
        if (isOther(p)) return p
    }
    return first(filter(polls.values(), isUnvoted))
  }

  function getUnvotedPolls(meeting: number) {
    return filterPolls(getMeetingUnvotedPredicate(meeting))
  }

  return {
    allPollTitles,
    anyAiPoll,
    anyPoll,
    anyPollWithProposal,
    createPoll,
    filterPolls,
    getPoll,
    getAiPolls,
    getMeetingPolls,
    getNextUnvotedPoll,
    getUnvotedPolls,
    getPollMethod,
    getPollStatus,
    getUserVote,
    isUnvotedPoll
  }
})
