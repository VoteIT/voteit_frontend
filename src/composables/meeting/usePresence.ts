import { reactive } from 'vue'

import presenceType from '@/contentTypes/presence'
import presenceCheckType from '@/contentTypes/presenceCheck'

import useAuthentication from '../useAuthentication'
import { Presence, PresenceCheck } from '@/contentTypes/types'

const presenceChecks = reactive<Map<number, PresenceCheck>>(new Map())
const presence = reactive<Map<number, Presence>>(new Map())

presenceCheckType.getChannel()
  .updateMap(presenceChecks)

const channel = presenceType.getChannel()
  .updateMap(presence)

export default function usePresence () {
  const { user } = useAuthentication()

  function getOpenPresenceCheck (meetingPk: number) {
    for (const pc of presenceChecks.values()) {
      if (pc.meeting === meetingPk && pc.state === 'open') {
        return pc
      }
    }
  }

  function getUserPresence (checkPk: number, userPk?: number) {
    userPk = userPk || user.value?.pk
    for (const p of presence.values()) {
      if (p.presence_check === checkPk && p.user === userPk) return p
    }
  }

  return {
    getOpenPresenceCheck,
    getUserPresence,
    channel
  }
}
