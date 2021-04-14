import { computed, reactive } from 'vue'

import meetingType from '@/contentTypes/meeting'
import { Meeting } from '@/contentTypes/types'
import { orderBy } from '@/utils'

export const meetings = reactive<Map<number, Meeting>>(new Map())

meetingType.getChannel()
  .updateMap(meetings)

export default function useMeetings () {
  const meetingApi = meetingType.getContentApi()

  const orderedMeetings = computed(() => {
    return orderBy([...meetings.values()], 'title')
  })

  async function fetchMeetings () {
    const { data } = await meetingApi.list()
    for (const m of data) {
      meetings.set(m.pk, m)
    }
  }

  function clearMeetings () {
    meetings.clear()
  }

  return {
    meetings,
    fetchMeetings,
    clearMeetings,
    orderedMeetings
  }
}
