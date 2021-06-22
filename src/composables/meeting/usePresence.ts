import { reactive } from 'vue'
import wu from 'wu'

import presenceType from '@/contentTypes/presence'
import presenceCheckType from '@/contentTypes/presenceCheck'

import useAuthentication from '../useAuthentication'
import { Presence, PresenceCheck } from '@/contentTypes/types'
import { PresenceCheckState } from '@/contentTypes/presenceCheck/workflowStates'
import { dateify } from '@/utils'

const presenceChecks = reactive<Map<number, PresenceCheck>>(new Map())
const presence = reactive<Map<number, Presence>>(new Map())
const presenceCount = reactive<Map<number, number>>(new Map())

interface PresenceCheckStatusMessage {
  pk: number
  present: number
}

presenceCheckType.getChannel()
  .updateMap(presenceChecks, pc => dateify(pc, ['opened', 'closed']))
  .on<PresenceCheckStatusMessage>('status', ({ pk, present }) => {
    presenceCount.set(pk, present)
  })

const channel = presenceType.getChannel()
  .updateMap(presence)

export default function usePresence () {
  const { user } = useAuthentication()

  function getClosedPresenceChecks (meeting: number): PresenceCheck[] {
    return [...wu(presenceChecks.values()).filter(
      pc => pc.meeting === meeting && pc.state === PresenceCheckState.Closed
    )]
  }

  function getOpenPresenceCheck (meeting: number): PresenceCheck | undefined {
    for (const pc of presenceChecks.values()) {
      if (pc.meeting === meeting && pc.state === 'open') {
        return pc
      }
    }
  }

  function getAllPresent (check: PresenceCheck): Presence[] {
    return [...wu(presence.values()).filter(
      p => p.presence_check === check.pk
    )]
  }

  function getUserPresence (check: number, userPk?: number): Presence | undefined {
    userPk = userPk || user.value?.pk
    for (const p of presence.values()) {
      if (p.presence_check === check && p.user === userPk) return p
    }
  }

  function getPresenceCount (check: PresenceCheck): number {
    return presenceCount.get(check.pk) ?? 0
  }

  async function closeCheck (check: PresenceCheck) {
    const api = presenceCheckType.getContentApi()
    return api.transition(check.pk, 'close')
  }

  async function openCheck (meeting: number) {
    const api = presenceCheckType.getContentApi()
    return api.add({
      meeting
    })
  }

  return {
    closeCheck,
    getClosedPresenceChecks,
    getOpenPresenceCheck,
    getAllPresent,
    getUserPresence,
    getPresenceCount,
    openCheck,
    channel
  }
}
