import wu from 'wu'
import { reactive } from 'vue'

import useChannels from '../useChannels'
import useRestApi from '../useRestApi'

const polls = reactive(new Map())

useChannels('poll')
  .updateMap(polls)
  .onStatus(item => {
    // Just update existing poll object
    const poll = polls.get(item.pk)
    if (poll && poll.voted <= item.voted) { // Throw away statuses with less votes - in case async order wrong
      Object.assign(poll, item)
    }
  })

export default function usePolls () {
  const restApi = useRestApi()

  function getPolls (meetingId, stateName) {
    const meetingPolls = wu(polls.values()).filter(
      p => p.meeting === meetingId && (!stateName || p.state === stateName)
    )
    return [...meetingPolls]
  }

  async function fetchPolls (meetingId) {
    return restApi.get('polls/', { params: { agenda_item__meeting: meetingId } })
      .then(({ data }) => {
        // Drop all polls, then push all
        polls.clear()
        data.forEach(p => {
          polls.set(p.pk, p)
        })
      })
  }

  function getPoll (pk) {
    return polls.get(pk)
  }

  return {
    fetchPolls,
    getPolls,
    getPoll
  }
}
