import { computed, ref } from 'vue'

import useRestApi from './useRestApi.js'
import useChannels from './useChannels.js'

const meetings = ref(new Map())
const meetingList = ref([]) // Sorted meeting id list

useChannels().registerUpdateHandler('roles', ({ t, p }) => {
  // Don't know about this, since we currently only allow one 'roles' handler
  if (p.model === 'Meeting') {
    const meeting = meetings.value.get(p.pk)
    switch (t) {
      case 'roles.removed':
        meeting.current_user_roles = meeting.current_user_roles.filter(r => !p.roles.includes(r))
        break
      case 'roles.added':
        Array.prototype.push.apply(meeting.current_user_roles, p.roles)
        break
    }
  }
})

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
