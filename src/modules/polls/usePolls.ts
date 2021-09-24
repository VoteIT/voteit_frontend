import { reactive } from 'vue'

import meetingType from '@/contentTypes/meeting'
import pollType from '@/contentTypes/poll'
import { Vote } from '@/contentTypes/types'
import { agendaDeletedEvent } from '@/modules/agendas/useAgenda'
import { dateify, mapFilter } from '@/utils'
import Channel from '@/contentTypes/Channel'
import { Poll, PollState, PollStatus } from './types'
import { PollMethod, PollMethodName } from './methods/types'

export const polls = reactive<Map<number, Poll>>(new Map())
const userVotes = reactive<Map<number, Vote>>(new Map())
const pollStatuses = reactive<Map<number, PollStatus>>(new Map())

pollType.getChannel()
  .updateMap(polls, p => dateify(p, ['started', 'closed']))
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
meetingType.getChannel()
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
    proposalsMin: 3,
    quickStart: true
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

export default function usePolls () {
  function getPolls (meeting: number, state?: string) {
    return [...mapFilter(
      polls,
      p => p.meeting === meeting && (!state || p.state === state)
    )]
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

  return {
    getPolls,
    getAiPolls,
    getPoll,
    getPollMethods,
    getPollStatus,
    getUserVote
  }
}
