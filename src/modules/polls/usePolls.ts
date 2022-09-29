import { reactive, computed } from 'vue'

import { mapFilter } from '@/utils'
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

const allPollTitles = computed(() => {
  return [...polls.values()].map(p => p.title)
})

function getPolls (meeting: number, state?: PollState) {
  return [...mapFilter(
    polls,
    p => p.meeting === meeting && (!state || p.state === state)
  )]
}

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

function getPollMethod (id: string) {
  return pollPlugins.getPlugin(id)
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

function getNextUnvotedPoll (meeting: number, poll?: Poll) {
  if (poll) {
    let found = false
    for (const p of iterUnvotedPolls(meeting)) {
      if (found) return p
      if (p.pk === poll.pk) found = true
    }
  }
  return iterUnvotedPolls(meeting).next().value
}

function getUnvotedPolls (meeting: number) {
  return [...iterUnvotedPolls(meeting)]
}

export default function usePolls () {
  return {
    allPollTitles,
    filterPolls,
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
