import { sorted } from 'itertools'
import { computed, MaybeRef, unref } from 'vue'

import useMeetingStore from '../useMeetingStore'

import type { ElectoralRegister } from './types'
import { hasWeightedVotes } from './utils'
import useERStore from './useERStore'

export default function useElectoralRegisters(meetingId?: MaybeRef<number>) {
  const store = useERStore()
  const { getMeeting } = useMeetingStore()

  const meeting = computed(() => {
    const meeting = unref(meetingId)
    if (!meeting) return
    return getMeeting(meeting)
  })

  const availableErMethods = computed(() => {
    if (erMethod.value && erMethodLocked.value) return [erMethod.value]
    if (!store.erMethods) return
    return store.erMethods.filter((method) => {
      if (!method.available) return false
      if (method.group_votes_active === null) return true
      return !!meeting.value?.group_votes_active === method.group_votes_active
    })
  })

  const erMethod = computed(() => {
    if (!meetingId) return
    return store.erMethods?.find(
      (erm) => erm.name === meeting.value?.er_policy_name
    )
  })
  const erMethodWeighted = computed(() => erMethod.value?.handles_vote_weight)
  const erMethodAllowsManual = computed(() => erMethod.value?.allow_manual)

  /**
   * If meeting has a dialect, and that dialect dictates an ER method, consider this to be locked
   */
  const erMethodLocked = computed(() => {
    return !!meeting.value?.dialect?.er_policy_name
  })

  function isMeetingER(er: ElectoralRegister | null): er is ElectoralRegister {
    return er?.meeting === unref(meetingId)
  }

  function getWeightInCurrent(user: number) {
    return currentElectoralRegister.value?.weights.find((w) => w.user === user)
      ?.weight
  }

  const sortedRegisters = computed(() => {
    if (!meetingId) return []
    return sorted(
      store.filterRegisters(isMeetingER).map((er) => ({
        ...er,
        hasWeightedVotes: hasWeightedVotes(er)
      })),
      (p) => p.created,
      true
    )
  })
  const currentElectoralRegister = computed(() => {
    return sortedRegisters.value.at(0)
  })
  const usersInCurrentRegister = computed(() => {
    return new Set(currentElectoralRegister.value?.weights.map((w) => w.user))
  })

  return {
    availableErMethods,
    currentElectoralRegister,
    erMethod,
    erMethodAllowsManual,
    erMethodLocked,
    erMethodWeighted,
    sortedRegisters,
    usersInCurrentRegister,
    getWeightInCurrent
  }
}
