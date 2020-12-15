import { ref } from 'vue'

import { restApi } from '@/utils'

const polls = ref([])

export default function usePolls () {
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

  return {
    fetchPolls,
    getPolls
  }
}
