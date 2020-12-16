import { computed, ref } from 'vue'

import useRestApi from './useRestApi.js'

const meetings = ref(new Map())
const meetingList = ref([]) // Sorted meeting id list

export default function useMeetings () {
  const { restApi } = useRestApi()

  const orderedMeetings = computed(_ => {
    return meetingList.value.map(id => meetings.value.get(id))
  })

  async function fetchMeetings () {
    return restApi.get('meetings/')
      .then(({ data }) => {
        data.forEach(m => {
          meetings.value.set(m.pk, m)
        })
        meetingList.value = data.map(m => m.pk)
      })
  }

  return {
    meetings,
    fetchMeetings,
    orderedMeetings
  }
}
