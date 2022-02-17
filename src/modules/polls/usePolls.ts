import { reactive, computed, watch } from 'vue'

import { mapFilter } from '@/utils'
import { Vote } from '@/contentTypes/types'
import { agendaDeletedEvent } from '../agendas/events'
import useBubbles from '../meetings/useBubbles'
import { meetingType } from '../meetings/contentTypes'

import { Poll, PollMethod, PollMethodName } from './methods/types'
import { pollType, voteType } from './contentTypes'
import { canVote } from './rules'
import { PollState, PollStatus } from './types'
import { pollStartedEvent } from './events'
import UnvotedPollsBubble from './UnvotedPollsBubble.vue'

export const polls = reactive<Map<number, Poll>>(new Map())
const userVotes = reactive<Map<number, Vote>>(new Map())
const pollStatuses = reactive<Map<number, PollStatus>>(new Map())

/* Register unvoted bubble */
useBubbles().register(UnvotedPollsBubble)

pollType
  .updateMap(polls, (poll, old) => {
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

// FIXME Maybe make this a Record<PollMethodName, Pollmethod>
const pollMethods: PollMethod[] = [
  {
    name: PollMethodName.CombinedSimple,
    proposalsMin: 1
  },
  {
    name: PollMethodName.Majority,
    proposalsMin: 2,
    proposalsMax: 2
  },
  {
    name: PollMethodName.Schulze,
    proposalsMin: 2,
    initialSettings: {
      stars: 5
    }
  },
  {
    name: PollMethodName.RepeatedSchulze,
    multipleWinners: true,
    proposalsMin: 3,
    winnersMin: 2,
    initialSettings: {
      winners: 2,
      stars: 5
    }
  },
  {
    name: PollMethodName.ScottishSTV,
    multipleWinners: true,
    proposalsMin: 3,
    winnersMin: 2,
    losersMin: 1,
    initialSettings: {
      winners: 2,
      allow_random: true
    }
  },
  {
    name: PollMethodName.InstantRunoff,
    proposalsMin: 3,
    initialSettings: {
      allow_random: true
    }
  },
  {
    name: PollMethodName.Dutt,
    proposalsMin: 3,
    initialSettings: {
      min: 0,
      max: 0
    }
  }
]

const allPollTitles = computed(() => {
  return [...polls.values()].map(p => p.title)
})

function getPolls (meeting: number, state?: PollState) {
  return [...mapFilter(
    polls,
    p => p.meeting === meeting && (!state || p.state === state)
  )]
}

export default function usePolls () {
  function filterPolls (filter: (poll: Poll) => boolean) {
    return mapFilter(polls, filter)
  }

  function getAiPolls (agendaItem: number, state?: PollState) {
    return [...mapFilter(
      polls,
      p => p.agenda_item === agendaItem && (!state || p.state === state)
    )]
  }

  function getPoll (pk: number) {
    return polls.get(pk)
  }

  function availableMethodFilter (method: PollMethod, proposalCount: number) {
    if (method.proposalsMin && proposalCount < method.proposalsMin) return false
    if (method.proposalsMax && proposalCount > method.proposalsMax) return false
    return true
  }

  function getPollMethod (name: PollMethodName) {
    return pollMethods.find(method => method.name === name) as PollMethod // Type casting should be safe, since this list should match
  }

  function getPollMethods (proposalCount?: number) {
    if (proposalCount === undefined) return pollMethods
    return pollMethods.filter(method => availableMethodFilter(method, proposalCount))
  }

  function getPollStatus (pk: number) {
    return pollStatuses.get(pk)
  }

  function getUserVote (poll: Poll): Vote | undefined {
    for (const vote of userVotes.values()) {
      if (vote.poll === poll.pk) return vote
    }
  }

  function iterUnvotedPolls (meeting: number) {
    return mapFilter(polls, p => {
      return p.meeting === meeting &&
        p.state === PollState.Ongoing &&
        canVote(p) &&
        !getUserVote(p)
    })
  }

  function getNextUnvotedPoll (meeting: number) {
    return iterUnvotedPolls(meeting).next().value
  }

  function getUnvotedPolls (meeting: number) {
    return [...iterUnvotedPolls(meeting)]
  }

  return {
    allPollTitles,
    filterPolls,
    getPolls,
    getAiPolls,
    getPoll,
    getPollMethod,
    getPollMethods,
    getPollStatus,
    getNextUnvotedPoll,
    getUnvotedPolls,
    getUserVote
  }
}
