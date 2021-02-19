import { reactive } from 'vue'

import presenceType from '@/contentTypes/presence'
import presenceCheckType from '@/contentTypes/presenceCheck'

import useAuthentication from '../useAuthentication'

const presenceChecks = reactive(new Map())
const presence = reactive(new Map())

presenceCheckType.useChannels()
  .updateMap(presenceChecks)

const channel = presenceType.useChannels()
  .updateMap(presence)

export default function usePresence () {
  const { user } = useAuthentication()

  function getOpenPresenceCheck (meeting) {
    for (const pc of presenceChecks.values()) {
      if (pc.meeting === meeting && pc.state === 'open') {
        return pc
      }
    }
  }

  function getUserPresence (checkId, userId) {
    userId = userId || user.value.pk
    for (const p of presence.values()) {
      if (p.presence_check === checkId && p.user === userId) return p
    }
  }

  return {
    getOpenPresenceCheck,
    getUserPresence,
    channel
  }
}
