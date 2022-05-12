import { computed, reactive, Ref } from 'vue'

import { mapFilter } from '@/utils'
import useAuthentication from '@/composables/useAuthentication'
import { Presence, PresenceCheck } from '@/contentTypes/types'
import useBubbles from '../meetings/useBubbles'

import { PresenceCheckState } from './workflowStates'
import { presenceCheckType, presenceType } from './contentTypes'
import PresenceCheckBubble from './PresenceCheckBubble.vue'
import useMeeting from '../meetings/useMeeting'
import { canAddPresenceCheck } from './rules'

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

useBubbles().register(PresenceCheckBubble)

export default function usePresence () {
  const { meeting, meetingId } = useMeeting()
  const { user } = useAuthentication()

  const closedPresenceChecks = computed(() => {
    return [...mapFilter(
      presenceChecks,
      pc => pc.meeting === meetingId.value && pc.state === PresenceCheckState.Closed
    )]
  })

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

  async function closeCheck () {
    if (!presenceCheck.value) throw new Error('No active presence check in meeting.')
    presenceCheckType.api.transition(presenceCheck.value.pk, 'close')
  }

  async function openCheck () {
    if (presenceCheck.value) throw new Error('Meeting already has a presence check.')
    presenceCheckType.api.add({
      meeting: meetingId.value
    })
  }

  function markPresence (check: PresenceCheck) {
    return presenceType.add({ presence_check: check.pk })
  }

  function undoPresence (presence: Presence) {
    return presenceType.delete(presence.pk)
  }

  const canManagePresence = computed(() => meeting.value && canAddPresenceCheck(meeting.value))
  // eslint-disable-next-line vue/return-in-computed-property
  const presenceCheck = computed(() => {
    for (const pc of presenceChecks.values()) {
      if (pc.meeting === meetingId.value && pc.state === 'open') {
        return pc
      }
    }
  })
  const presentUserIds = computed(() => [...mapFilter(presence, p => p.presence_check === presenceCheck.value?.pk)].map(p => p.user))
  const userPresence = computed(() => presenceCheck.value && getUserPresence(presenceCheck.value.pk))
  const isPresent = computed(() => presenceCheck.value && !!userPresence.value) // undefined or boolean

  return {
    canManagePresence,
    closedPresenceChecks,
    isPresent,
    presenceCheck,
    presenceCount: computed(() => presenceCheck.value && (presenceCount.get(presenceCheck.value.pk) ?? 0)),
    presentUserIds,
    userPresence,
    closeCheck,
    getAllPresent,
    getUserPresence,
    markPresence,
    openCheck,
    undoPresence
  }
}
