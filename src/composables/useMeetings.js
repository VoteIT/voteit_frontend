import { computed, ref } from 'vue'

import useContentApi from './useContentApi'
import useChannels from './useChannels'

const meetings = ref(new Map())
const meetingList = ref([]) // Sorted meeting id list

useChannels('meeting')
  .updateMap(meetings.value)

export default function useMeetings () {
  const meetingApi = useContentApi('meeting')

  const orderedMeetings = computed(_ => {
    return meetingList.value.map(id => meetings.value.get(id))
  })

  async function fetchMeetings () {
    return meetingApi.list()
      .then(({ data }) => {
        data.forEach(m => {
          meetings.value.set(m.pk, m)
        })
        meetingList.value = data.map(m => m.pk)
      })
  }

  function clearMeetings () {
    meetingList.value = []
    meetings.value.clear()
  }

  return {
    meetings,
    fetchMeetings,
    clearMeetings,
    orderedMeetings
  }
}
