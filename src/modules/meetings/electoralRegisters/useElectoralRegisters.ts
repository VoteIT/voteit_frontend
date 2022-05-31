import { orderBy } from 'lodash'
import { computed, reactive, Ref } from 'vue'

import { dateify } from '@/utils'
import { electoralRegisterType } from '../contentTypes'
import { meetings } from '../useMeetings'

import type { ElectoralRegister, ErDefinition } from './types'

// Needs reactive, so that permission checks are run again when an ER is inserted.
const registers = reactive<Map<number, ElectoralRegister | null>>(new Map())

electoralRegisterType
  .updateMap(registers as Map<number, ElectoralRegister>) // Don't bother about that null value. That's ok.

const erMethods: ErDefinition[] = [
  {
    name: 'auto_before_poll'
  },
  {
    allowManual: true,
    name: 'presence_check'
  },
  {
    allowManual: true,
    name: 'manual'
  },
  {
    name: 'auto_always'
  }
]

export default function useElectoralRegisters (meetingId?: Ref<number>) {
  const erMethod = computed<ErDefinition | undefined>(() => {
    if (!meetingId) return
    const m = meetings.get(meetingId.value)
    if (!m) return
    return erMethods.find(erm => erm.name === m.er_policy_name)
  })

  async function fetchRegister (pk: number) {
    registers.set(pk, null) // If it has any value, will not fetch again
    try {
      const { data } = await electoralRegisterType.api.retrieve(pk)
      registers.set(pk, dateify(data))
    } catch {
      registers.delete(pk) // Enables trying again.
    }
  }

  async function fetchRegisters () {
    if (!meetingId) throw new Error('Call using useElectoralRegisters(Ref<meetingId>) to fetch meeting registers')
    try {
      const { data } = await electoralRegisterType.api.list({ meeting: meetingId.value })
      for (const er of data) {
        registers.set(er.pk, dateify(er))
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
    currentElectoralRegister,
    erMethod,
    erMethods,
    sortedRegisters,
    clearRegisters,
    hasWeightedVotes,
    getRegister,
    fetchRegisters
  }
}
