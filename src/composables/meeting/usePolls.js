import { ref } from 'vue'

import useChannels from '../useChannels'
import useRestApi from '../useRestApi'

const polls = ref([])
const pollStatuses = ref(new Map())

useChannels('poll')
  .onChange(item => {
    const index = polls.value.findIndex(p => p.pk === item.pk)
    if (index !== -1) {
      polls.value[index] = item
    } else {
      polls.value.push(item)
    }
  })
  .onDelete(item => {
    const index = polls.value.findIndex(p => p.pk === item.pk)
    if (index !== -1) {
      polls.value.splice(index, 1)
    }
  })
  .onStatus(item => {
    pollStatuses.value.set(item.pk, item)
  })

export default function usePolls () {
  const restApi = useRestApi()

  function getPolls (meetingId, stateName) {
    if (stateName) {
      return polls.value.filter(p => p.meeting === meetingId && p.state === stateName)
    }
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

  // Channels will handle this
  // async function fetchPollStatus (pk) {
  //   return restApi.get(`polls/${pk}/`)
  //     .then(({ data }) => {
  //       pollStatuses.value.set(data.pk, data)
  //     })
  // }

  function getPollStatus (pk) {
    return pollStatuses.value.get(pk)
  }

  return {
    fetchPolls,
    getPolls,
    // fetchPollStatus,
    getPollStatus
  }
}
