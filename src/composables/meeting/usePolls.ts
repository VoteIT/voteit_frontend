import wu from 'wu'
import { reactive } from 'vue'

import useChannels from '../useChannels'

import meetingType from '@/contentTypes/meeting'
import pollType from '@/contentTypes/poll'
import { Poll, PollStatus } from '@/contentTypes/types'

const polls = reactive<Map<number, Poll>>(new Map())
const pollStatuses = reactive<Map<number, PollStatus>>(new Map())

pollType.useChannels()
  .updateMap(polls)
  .onStatus((item: PollStatus) => {
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
** Clear private polls when leaving moderators channel.
*/
useChannels('moderators')
  .onLeave(pk => {
    for (const poll of polls.values()) {
      if (poll.meeting === pk && poll.state === 'private') {
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
