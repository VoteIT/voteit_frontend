import { computed, reactive, Ref } from 'vue'

import { mapFilter } from '@/utils'
import useAuthentication from '@/composables/useAuthentication'
import { Presence, PresenceCheck } from '@/contentTypes/types'
import useBubbles from '../meetings/useBubbles'

import { PresenceCheckState } from './workflowStates'
import { presenceCheckType, presenceType } from './contentTypes'
import PresenceCheckBubble from './PresenceCheckBubble.vue'
import { canAddPresenceCheck } from './rules'

const presenceChecks = reactive<Map<number, PresenceCheck>>(new Map())
const presence = reactive<Map<number, Presence>>(new Map())

presenceCheckType.updateMap(presenceChecks)
presenceType.updateMap(presence)

useBubbles().register(PresenceCheckBubble)

const { user } = useAuthentication()

export default function usePresence (meetingId: Ref<number>) {
  const closedPresenceChecks = computed(() => {
    return [...mapFilter(
      presenceChecks,
      pc => pc.meeting === meetingId.value && pc.state === PresenceCheckState.Closed
    )]
  })

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

  // eslint-disable-next-line camelcase
  function changePresence (presence_check: number, present: boolean) {
    return presenceType.methodCall('change', {
      // eslint-disable-next-line camelcase
      presence_check,
      present
    })
  }

  const canManagePresence = computed(() => canAddPresenceCheck(meetingId.value))
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
    presenceCount: computed(() => presentUserIds.value.length),
    presentUserIds,
    userPresence,
    changePresence,
    closeCheck,
    openCheck
  }
}
