import { computed, reactive, ref } from 'vue'

import meetingType from '@/contentTypes/meeting'
import { Meeting } from '@/contentTypes/types'

export const meetings = reactive<Map<number, Meeting>>(new Map())
const meetingList = ref<number[]>([]) // Sorted meeting id list

meetingType.useChannels()
  .updateMap(meetings)

export default function useMeetings () {
  const meetingApi = meetingType.useContentApi()

  const orderedMeetings = computed(_ => {
    return meetingList.value.map(id => meetings.get(id))
  })

  async function fetchMeetings () {
    return meetingApi.list()
      .then(({ data }: { data: Meeting[] }) => {
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
