import { dropwhile, filter, first, ifilter, Predicate } from 'itertools'
import { reactive, computed } from 'vue'

import { Vote } from '@/contentTypes/types'
import { agendaDeletedEvent } from '../agendas/events'
import useBubbles from '../meetings/useBubbles'
import { meetingType } from '../meetings/contentTypes'

import { Poll } from './methods/types'
import { pollType, voteType } from './contentTypes'
import { canVote } from './rules'
import { PollState, PollStatus } from './types'
import { pollStartedEvent } from './events'
import UnvotedPollsBubble from './UnvotedPollsBubble.vue'
import { pollPlugins } from './registry'

export const polls = reactive<Map<number, Poll>>(new Map())
const userVotes = reactive<Map<number, Vote>>(new Map())
const pollStatuses = reactive<Map<number, PollStatus>>(new Map())

/* Register unvoted bubble */
useBubbles().register(UnvotedPollsBubble)

pollType
  .updateMap(polls, (poll, old) => {
    // Warn if we got an unknown poll method
    if (!pollPlugins.hasPlugin(poll.method_name)) console.warn(`Unknown poll method: ${poll.method_name}`)
    // Emit an event if started
    if (poll.state === PollState.Ongoing && poll.state !== old?.state) pollStartedEvent.emit(poll)
  })
  .on<PollStatus>('status', item => {
    const existing = pollStatuses.get(item.pk)
    // Throw away statuses with less votes - in case async order wrong
    if (!existing || existing.voted < item.voted) {
      pollStatuses.set(item.pk, item)
    }
  })
  .channel.onLeave(uri => {
    // Assume uri 'poll/<pk>'
    const pk = Number((uri as string).split('/')[1])
    pollStatuses.delete(pk)
  })

// This is not really a channel, per se...
voteType.updateMap(userVotes)

/*
** Clear polls when leaving meeting.
*/
meetingType.channel
  .onLeave(pk => {
    for (const poll of polls.values()) {
      if (poll.meeting === pk) polls.delete(poll.pk)
    }
  })

/*
** Clear private polls when agenda item deleted.
*/
agendaDeletedEvent.on(pk => {
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
  return [...polls.values()].map(p => p.title)
})

function getPolls (meeting: number, state?: PollState) {
  return filterPolls(p => p.meeting === meeting && (!state || p.state === state))
}

/**
 * Get all polls that matches filter
 */
function filterPolls (_filter: (poll: Poll) => boolean) {
  return filter(polls.values(), _filter)
}

/**
 * Get first poll that matches filter
 */
function firstPoll (filter: (poll: Poll) => boolean) {
  return first(polls.values(), filter)
}

function getAiPolls (agendaItem: number, state?: PollState) {
  return filterPolls(p => p.agenda_item === agendaItem && (!state || p.state === state))
}

function getPoll (pk: number) {
  return polls.get(pk)
}

function getPollMethod (id: string) {
  return pollPlugins.getPlugin(id)
}

function getPollStatus (pk: number) {
  return pollStatuses.get(pk)
}

function getUserVote (poll: Poll) {
  return first(
    userVotes.values(),
    vote => vote.poll === poll.pk
  )
}

function isUnvotedPoll (poll: Poll) {
  return (
    poll.state === PollState.Ongoing &&
    canVote(poll) &&
    !getUserVote(poll)
  )
}

/**
 * Generate a predicate to filter on current users unvoted polls in meeting.
 */
function getMeetingUnvotedPredicate (meeting: number): Predicate<Poll> {
  return (poll: Poll) => poll.meeting === meeting && isUnvotedPoll(poll)
}

/**
 * Get first ongoing poll in a meeting that current user hasn't voted in.
 * @param poll If provided, function will return next unvoted poll in order
 */
function getNextUnvotedPoll (meeting: number, poll?: Poll) {
  const isUnvoted = getMeetingUnvotedPredicate(meeting)
  if (poll) {
    const isOther = ({ pk }: Poll) => pk !== poll.pk
    for (const p of ifilter(dropwhile(polls.values(), isOther), isUnvoted)) {
      if (isOther(p)) return p
    }
  }
  return first(filter(polls.values(), isUnvoted))
}

function getUnvotedPolls (meeting: number) {
  return filterPolls(getMeetingUnvotedPredicate(meeting))
}

export default function usePolls () {
  return {
    allPollTitles,
    firstPoll,
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
