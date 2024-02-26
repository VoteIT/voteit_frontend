import { any, dropwhile, filter, first, ifilter, Predicate } from 'itertools'
import { reactive, computed } from 'vue'

import { Vote } from '@/contentTypes/types'
import { agendaDeletedEvent } from '../agendas/events'

import { pollType, voteType } from './contentTypes'
import { canVote } from './rules'
import { Poll, PollState, PollStatus } from './types'
import { pollPlugins } from './registry'

export const polls = reactive<Map<number, Poll>>(new Map())
const userVotes = reactive<Map<number, Vote>>(new Map())
const pollStatuses = reactive<Map<number, PollStatus>>(new Map())

pollType
  .updateMap(polls, { participants: 'meeting', moderators: 'meeting' })
  .on<PollStatus>('status', (item) => {
    const existing = pollStatuses.get(item.pk)
    // Throw away statuses with less votes - in case async order wrong
    if (!existing || existing.voted < item.voted) {
      pollStatuses.set(item.pk, item)
    }
  })
  .channel.onLeave((pk) => {
    pollStatuses.delete(pk)
  })

// This is not really a channel, per se...
voteType.updateMap(userVotes)

/*
 ** Clear private polls when agenda item deleted.
 */
agendaDeletedEvent.on((pk) => {
  for (const poll of polls.values()) {
    if (poll.agenda_item === pk) {
      polls.delete(poll.pk)
    }
  }
})

/**
 * Used to compute a unique poll title
 */
const allPollTitles = computed(() => {
  return [...polls.values()].map((p) => p.title)
})

function getPolls(meeting: number, state?: PollState) {
  return filterPolls(
    (p) => p.meeting === meeting && (!state || p.state === state)
  )
}

/**
 * Get all polls that matches filter
 */
export function filterPolls(predicate: (poll: Poll) => boolean) {
  return filter(polls.values(), predicate)
}

/**
 * Check if any poll matches filter
 */
export function anyPoll(filter: (poll: Poll) => boolean) {
  return any(polls.values(), filter)
}

function getAiPolls(agendaItem: number, state?: PollState) {
  return filterPolls(
    (p) => p.agenda_item === agendaItem && (!state || p.state === state)
  )
}

function getPoll(pk: number) {
  return polls.get(pk)
}

function getPollMethod(id: string) {
  return pollPlugins.getPlugin(id)
}

export function getPollStatus(pk: number) {
  return pollStatuses.get(pk)
}

export function getUserVote(poll: Poll) {
  return first(userVotes.values(), (vote) => vote.poll === poll.pk)
}

function isUnvotedPoll(poll: Poll) {
  return poll.state === PollState.Ongoing && canVote(poll) && !getUserVote(poll)
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
export function getNextUnvotedPoll(meeting: number, poll?: Poll) {
  const isUnvoted = getMeetingUnvotedPredicate(meeting)
  if (poll) {
    const isOther = ({ pk }: Poll) => pk !== poll.pk
    for (const p of ifilter(dropwhile(polls.values(), isOther), isUnvoted)) {
      if (isOther(p)) return p
    }
  }
  return first(filter(polls.values(), isUnvoted))
}

function getUnvotedPolls(meeting: number) {
  return filterPolls(getMeetingUnvotedPredicate(meeting))
}

export default function usePolls() {
  return {
    allPollTitles,
    anyPoll,
    getPolls,
    getAiPolls,
    getPoll,
    getPollMethod,
    getPollStatus,
    getNextUnvotedPoll,
    getUnvotedPolls,
    getUserVote
  }
}
