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
import { computed, reactive } from 'vue'

import { Vote } from '@/contentTypes/types'
import { agendaDeletedEvent } from '../agendas/events'

import { pollType, voteType } from './contentTypes'
import { pollPlugins } from './registry'
import { canVote } from './rules'
import { Poll, PollState, PollStatus } from './types'
import type { PollStartData } from './methods/types'

export default defineStore('polls', () => {
  const polls = reactive(new Map<number, Poll>())
  const userVotes = reactive(new Map<number, Vote>())
  const pollStatuses = reactive(new Map<number, PollStatus>())

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
    for (const poll of polls.values())
      if (poll.agenda_item === pk) polls.delete(poll.pk)
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
    const { data } = await pollType.api.add(pollData)
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
    return filterPolls(
      (p) => p.agenda_item === agendaItem && (!state || p.state === state)
    )
  }

  function getMeetingPolls(meeting: number, state?: PollState) {
    return filterPolls(
      (p) => p.meeting === meeting && (!state || p.state === state)
    )
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
    return first(userVotes.values(), (vote) => vote.poll === poll.pk)
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
   * Generate a predicate to filter on current users unvoted polls in meeting.
   */
  function getMeetingUnvotedPredicate(meeting: number): Predicate<Poll> {
    return (poll: Poll) => poll.meeting === meeting && isUnvotedPoll(poll)
  }

  /**
   * Get first ongoing poll in a meeting that current user hasn't voted in.
   * @param poll If provided, function will return next unvoted poll in order
   */
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
    anyPoll,
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
