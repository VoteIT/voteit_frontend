import { ref } from 'vue'
import useRestApi from '../useRestApi'

const polls = ref([])

export default function usePolls () {
  const { restApi } = useRestApi()

  const setPolls = function (meetingId, newPolls) {
    // Drop all polls for this meeting, then push all
    polls.value = polls.value.filter(p => p.meeting !== meetingId)
    Array.prototype.push.apply(polls.value, polls)
  }

  function getPolls (meetingId) {
    return polls.value.filter(p => p.meeting === meetingId)
  }

  async function fetchPolls (meetingId) {
    return restApi.get('polls/', { params: { agenda_item__meeting: meetingId } })
      .then(({ data }) => {
        setPolls(meetingId, data)
      })
  }

  return {
    fetchPolls,
    getPolls
  }
}
