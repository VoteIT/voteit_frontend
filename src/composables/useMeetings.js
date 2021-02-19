import { computed, reactive, ref } from 'vue'

import meetingType from '@/contentTypes/meeting'

export const meetings = reactive(new Map())
const meetingList = ref([]) // Sorted meeting id list

meetingType.useChannels()
  .updateMap(meetings)

export default function useMeetings () {
  const meetingApi = meetingType.useContentApi()

  const orderedMeetings = computed(_ => {
    return meetingList.value.map(id => meetings.get(id))
  })

  async function fetchMeetings () {
    return meetingApi.list()
      .then(({ data }) => {
        data.forEach(m => {
          meetings.set(m.pk, m)
        })
        meetingList.value = data.map(m => m.pk)
      })
  }

  function clearMeetings () {
    meetingList.value = []
    meetings.clear()
  }

  return {
    meetings,
    fetchMeetings,
    clearMeetings,
    orderedMeetings
  }
}
