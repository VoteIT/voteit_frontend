import { reactive } from 'vue'

import useAuthentication from '@/composables/useAuthentication'
import { Presence, PresenceCheck } from '@/contentTypes/types'
import { PresenceCheckState } from '@/modules/presence/workflowStates'
import { mapFilter } from '@/utils'
import { presenceCheckType, presenceType } from './contentTypes'

const presenceChecks = reactive<Map<number, PresenceCheck>>(new Map())
const presence = reactive<Map<number, Presence>>(new Map())
const presenceCount = reactive<Map<number, number>>(new Map())

interface PresenceCheckStatusMessage {
  pk: number
  present: number
}

presenceCheckType
  .updateMap(presenceChecks)
  .on<PresenceCheckStatusMessage>('status', ({ pk, present }) => {
    presenceCount.set(pk, present)
  })

presenceType.updateMap(presence)

export default function usePresence () {
  const { user } = useAuthentication()

  function getClosedPresenceChecks (meeting: number): PresenceCheck[] {
    return [...mapFilter(
      presenceChecks,
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
    return [...mapFilter(
      presence,
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

  function markPresence (check: PresenceCheck) {
    presenceType.add({ presence_check: check.pk })
  }

  function undoPresence (presence: Presence) {
    presenceType.delete(presence.pk)
  }

  return {
    closeCheck,
    getClosedPresenceChecks,
    getOpenPresenceCheck,
    getAllPresent,
    getUserPresence,
    getPresenceCount,
    markPresence,
    openCheck,
    undoPresence
  }
}
