import { orderBy } from 'lodash'
import { computed, reactive, ref, Ref } from 'vue'

import { electoralRegisterType, erMethodType } from '../contentTypes'
import { meetings } from '../useMeetings'

import type { ElectoralRegister, ErMethod } from './types'

// Needs reactive, so that permission checks are run again when an ER is inserted.
const registers = reactive<Map<number, ElectoralRegister | null>>(new Map())

electoralRegisterType
  .updateMap(registers as Map<number, ElectoralRegister>) // Don't bother about that null value. That's ok.

const _erMethods = ref<ErMethod[] | null>(null)

async function fetchErMethods () {
  try {
    const { data } = await erMethodType.api.list()
    _erMethods.value = data
  } catch {} // TODO
}

function clearRegisters () {
  registers.clear()
}

function getErMethod (name: string) {
  return _erMethods.value?.find(erm => erm.name === name)
}

async function fetchRegister (pk: number) {
  registers.set(pk, null) // If it has any value, will not fetch again
  try {
    const { data } = await electoralRegisterType.api.retrieve(pk)
    registers.set(pk, data)
  } catch {
    registers.delete(pk) // Enables trying again.
  }
}

function getRegister (pk: number) {
  if (!registers.has(pk)) fetchRegister(pk) // Will set register to null while getting
  return registers.get(pk) as ElectoralRegister | null
}

function hasWeightedVotes ({ weights }: ElectoralRegister) {
  return weights.some(({ weight }) => weight !== 1)
}

const erMethods = computed<ErMethod[] | null>(() => {
  if (!_erMethods.value) fetchErMethods()
  return _erMethods.value
})

export default function useElectoralRegisters (meetingId?: Ref<number>) {
  const meeting = computed(() => meetingId && meetings.get(meetingId.value))

  const availableErMethods = computed(() => {
    if (!erMethods.value) return
    return erMethods.value.filter(method => {
      // Dialect defined method is always available
      if (erDialectMethod.value && method.name === erDialectMethod.value.name) return true
      if (!method.available) return false
      // If method requires a specific setting for group_votes active, only show if meetings has that setting
      if (method.group_votes_active !== null) return !!meeting.value?.group_votes_active === method.group_votes_active
      return true
    })
  })

  const erMethod = computed(() => erMethods.value?.find(erm => erm.name === meeting.value?.er_policy_name))
  const erMethodWeighted = computed(() => erMethod.value?.handles_vote_weight)

  const erMethodAllowsManual = computed(() => erMethod.value?.allow_manual)
  /**
   * ER method recommended by meeting dialect?
   */
  const erDialectMethod = computed(() => erMethods.value?.find(er => er.name === meeting.value?.dialect?.er_policy_name))
  /**
   * Used to warn if "wrong" ER method is selected, if meeting has a dialect with defined ER method
   */
  const erDialectMethodWarning = computed(() => !!erDialectMethod.value && erDialectMethod.value.name !== meeting.value?.er_policy_name)
  // /**
  //  * If meeting has a dialect, and that dialect dictates an ER method, consider this to be locked
  //  */
  // const erMethodLocked = computed(() => {
  //   return !!meeting.value?.dialect?.er_policy_name
  // })

  async function fetchRegisters () {
    if (!meetingId) throw new Error('Call using useElectoralRegisters(Ref<meetingId>) to fetch meeting registers')
    try {
      const { data } = await electoralRegisterType.api.list({ meeting: meetingId.value })
      for (const er of data) {
        registers.set(er.pk, er)
      }
    } catch {} // TODO
  }

  function isMeetingER (er: ElectoralRegister | null): er is ElectoralRegister {
    return er?.meeting === meetingId?.value
  }

  function getWeightInCurrent (user: number) {
    return currentElectoralRegister.value?.weights.find(w => w.user === user)?.weight
  }

  const sortedRegisters = computed(() => {
    if (!meetingId) return []
    return orderBy(
      [...registers.values()]
        .filter(isMeetingER)
        .map(er => ({
          ...er,
          hasWeightedVotes: hasWeightedVotes(er)
        })),
      ['created'], ['desc']
    )
  })
  const currentElectoralRegister = computed(() => {
    return sortedRegisters.value.at(0)
  })

  return {
    availableErMethods,
    currentElectoralRegister,
    erDialectMethod,
    erDialectMethodWarning,
    erMethod,
    erMethodAllowsManual,
    // erMethodLocked,
    erMethodWeighted,
    erMethods,
    sortedRegisters,
    clearRegisters,
    getErMethod,
    getRegister,
    getWeightInCurrent,
    hasWeightedVotes,
    fetchRegisters
  }
}
