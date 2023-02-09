import { orderBy } from 'lodash'
import { computed, reactive, ref, Ref } from 'vue'

import { dateify } from '@/utils'
import { electoralRegisterType, erMethodType } from '../contentTypes'
import { meetings } from '../useMeetings'

import type { ElectoralRegister, ErMethod } from './types'
import { filter } from 'itertools'

// Needs reactive, so that permission checks are run again when an ER is inserted.
const registers = reactive<Map<number, ElectoralRegister | null>>(new Map())

electoralRegisterType
  .updateMap(registers as Map<number, ElectoralRegister>) // Don't bother about that null value. That's ok.

const erMethods = ref<ErMethod[] | null>(null)

function isAvailableMethod (method: ErMethod) {
  return method.available
}

async function fetchErMethods () {
  try {
    const { data } = await erMethodType.api.list()
    erMethods.value = data
  } catch {} // TODO
}

export default function useElectoralRegisters (meetingId?: Ref<number>) {
  const meeting = computed(() => meetingId && meetings.get(meetingId.value))

  // eslint-disable-next-line vue/return-in-computed-property
  const availableErMethods = computed(() => {
    if (erMethod.value && erMethodLocked.value) return [erMethod.value]
    if (erMethods.value) return filter(erMethods.value, isAvailableMethod)
    fetchErMethods()
  })

  const erMethod = computed<ErMethod | undefined>(() => {
    if (!meetingId) return
    if (!erMethods.value) fetchErMethods()
    return erMethods.value?.find(erm => erm.name === meeting.value?.er_policy_name)
  })

  const erMethodLocked = computed(() => {
    return !erMethod.value?.available
  })

  async function fetchRegister (pk: number) {
    registers.set(pk, null) // If it has any value, will not fetch again
    try {
      const { data } = await electoralRegisterType.api.retrieve(pk)
      registers.set(pk, dateify(data, 'created'))
    } catch {
      registers.delete(pk) // Enables trying again.
    }
  }

  async function fetchRegisters () {
    if (!meetingId) throw new Error('Call using useElectoralRegisters(Ref<meetingId>) to fetch meeting registers')
    try {
      const { data } = await electoralRegisterType.api.list({ meeting: meetingId.value })
      for (const er of data) {
        registers.set(er.pk, dateify(er, 'created'))
      }
    } catch {} // TODO
  }

  function clearRegisters () {
    registers.clear()
  }

  const sortedRegisters = computed(() => {
    if (!meetingId) return []
    return orderBy(
      [...registers.values()].filter(er => er?.meeting === meetingId.value),
      ['created'], ['desc']
    ) as ElectoralRegister[]
  })
  const currentElectoralRegister = computed(() => {
    return sortedRegisters.value[0] as ElectoralRegister | undefined
  })

  function getRegister (pk: number) {
    if (!registers.has(pk)) fetchRegister(pk) // Will set register to null while getting
    return registers.get(pk) as ElectoralRegister | null
  }

  function hasWeightedVotes ({ weights }: ElectoralRegister) {
    return weights.some(({ weight }) => weight !== 1)
  }

  return {
    availableErMethods,
    currentElectoralRegister,
    erMethod,
    erMethodLocked,
    erMethods,
    sortedRegisters,
    clearRegisters,
    hasWeightedVotes,
    getRegister,
    fetchRegisters
  }
}
