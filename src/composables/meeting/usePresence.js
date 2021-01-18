import { ref } from 'vue'
import useChannels from '../useChannels'
import useAuthentication from '../useAuthentication'

const presenceChecks = ref(new Map())
const presence = ref(new Map())

useChannels('presence_check')
  .updateMap(presenceChecks.value)

const channel = useChannels('presence')
  .updateMap(presence.value)

export default function usePresence () {
  const { user } = useAuthentication()

  function getOpenPresenceCheck (meeting) {
    for (const pc of presenceChecks.value.values()) {
      if (pc.meeting === meeting && pc.state === 'open') {
        return pc
      }
    }
  }

  function getUserPresence (checkId, userId) {
    userId = userId || user.value.pk
    for (const p of presence.value.values()) {
      if (p.presence_check === checkId && p.user === userId) return p
    }
  }

  return {
    getOpenPresenceCheck,
    getUserPresence,
    channel
  }
}
