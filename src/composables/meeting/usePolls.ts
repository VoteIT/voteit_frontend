import wu from 'wu'
import { reactive } from 'vue'

import meetingType from '@/contentTypes/meeting'
import pollType from '@/contentTypes/poll'
import { Poll, PollStatus } from '@/contentTypes/types'
import Channel from '@/contentTypes/Channel'
import { agendaDeletedEvent } from './useAgenda'

const polls = reactive<Map<number, Poll>>(new Map())
const pollStatuses = reactive<Map<number, PollStatus>>(new Map())

pollType.useChannels()
  .updateMap(polls)
  .onStatus((_: any) => {
    const item = _ as PollStatus
    const existing = pollStatuses.get(item.pk)
    // Throw away statuses with less votes - in case async order wrong
    if (!existing || existing.voted < item.voted) {
      pollStatuses.set(item.pk, item)
    }
  })

/*
** Clear polls when leaving meeting.
*/
meetingType.useChannels()
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

export default function usePolls () {
  function getPolls (meeting: number, state?: string) {
    const meetingPolls = wu(polls.values()).filter(
      p => p.meeting === meeting && (!state || p.state === state)
    )
    return [...meetingPolls]
  }

  function getPoll (pk: number) {
    return polls.get(pk)
  }

  function getPollStatus (pk: number) {
    return pollStatuses.get(pk)
  }

  return {
    getPolls,
    getPoll,
    getPollStatus
  }
}
