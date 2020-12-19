import { ref } from 'vue'

import useChannels from '../useChannels'
import useRestApi from '../useRestApi'

const polls = ref([])
const pollStatuses = ref(new Map())

useChannels('poll')
  .onUpdate(({ t, p }) => {
    const item = p.item || p // Can be only a pk
    const index = polls.value.findIndex(p => p.pk === item.pk)
    switch (t) {
      case 'poll.changed':
      case 'poll.added':
        if (index !== -1) {
          polls.value[index] = item
        } else {
          polls.value.push(item)
        }
        break
      case 'poll.deleted':
        if (index !== -1) {
          polls.value.splice(index, 1)
        }
        break
      case 'poll.status':
        pollStatuses.value.set(p.pk, p)
        break
    }
  })

export default function usePolls () {
  const restApi = useRestApi()

  function getPolls (meetingId) {
    return polls.value.filter(p => p.meeting === meetingId)
  }

  async function fetchPolls (meetingId) {
    return restApi.get('polls/', { params: { agenda_item__meeting: meetingId } })
      .then(({ data }) => {
        // Drop all polls for this meeting, then push all
        polls.value = polls.value.filter(p => p.meeting !== meetingId)
        Array.prototype.push.apply(polls.value, data)
      })
  }

  async function fetchPollStatus (pk) {
    return restApi.get(`polls/${pk}/`)
      .then(({ data }) => {
        pollStatuses.value.set(data.pk, data)
      })
  }

  function getPollStatus (pk) {
    return pollStatuses.value.get(pk)
  }

  return {
    fetchPolls,
    getPolls,
    fetchPollStatus,
    getPollStatus
  }
}
