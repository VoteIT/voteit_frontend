import { reactive, computed } from 'vue'

import { Vote } from '@/contentTypes/types'
import { agendaDeletedEvent } from '@/modules/agendas/useAgenda'
import { mapFilter } from '@/utils'
import Channel from '@/contentTypes/Channel'
import { PollState, PollStatus } from './types'
import { Poll, PollMethod, PollMethodName } from './methods/types'
import { meetingType } from '../meetings/contentTypes'
import { pollType } from './contentTypes'
import { canVote } from './rules'

export const polls = reactive<Map<number, Poll>>(new Map())
const userVotes = reactive<Map<number, Vote>>(new Map())
const pollStatuses = reactive<Map<number, PollStatus>>(new Map())

pollType
  .channelUpdateMap(polls)
  .onStatus((_: any) => {
    const item = _ as PollStatus
    const existing = pollStatuses.get(item.pk)
    // Throw away statuses with less votes - in case async order wrong
    if (!existing || existing.voted < item.voted) {
      pollStatuses.set(item.pk, item)
    }
  })
  .onLeave(uri => {
    // Assume uri 'poll/<pk>'
    const pk = Number((uri as string).split('/')[1])
    pollStatuses.delete(pk)
  })

// This is not really a channel
new Channel<Vote>('vote')
  .updateMap(userVotes)

/*
** Clear polls when leaving meeting.
*/
meetingType.channel
  .onLeave(pk => {
    for (const poll of polls.values()) {
      if (poll.meeting === pk) {
        polls.delete(poll.pk)
      }
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

const pollMethods: PollMethod[] = [
  {
    name: PollMethodName.CombinedSimple,
    title: 'Simple majority',
    proposalsMin: 1,
    quickStart: true
  },
  {
    name: PollMethodName.Schulze,
    title: 'Schulze',
    proposalsMin: 2,
    quickStart: true,
    initialSettings: {
      stars: 5
    }
  },
  {
    name: PollMethodName.RepeatedSchulze,
    title: 'Repeated Schulze',
    multipleWinners: true,
    proposalsMin: 3,
    winnersMin: 2,
    initialSettings: {
      winners: 2
    }
  },
  {
    name: PollMethodName.ScottishSTV,
    title: 'Scottish STV',
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
    title: 'Instant-Runoff Voting',
    proposalsMin: 3,
    initialSettings: {
      allow_random: true
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

  function getPollMethods (proposalCount?: number, annotateDisabled = false) {
    if (proposalCount === undefined) return pollMethods
    // Annotate only
    if (annotateDisabled) return pollMethods.map(method => ({ ...method, disabled: !availableMethodFilter(method, proposalCount) }))
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
    getPollMethods,
    getPollStatus,
    getNextUnvotedPoll,
    getUnvotedPolls,
    getUserVote
  }
}
