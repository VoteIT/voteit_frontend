import { orderBy } from 'lodash'
import { computed, Ref } from 'vue'
import { meetings } from '../useMeetings'

import { ElectoralRegister, ErDefinition } from './types'
import useElectoralRegisters from './useElectoralRegisters'

export default function useElectoralRegister (meeting: Ref<number>) {
  const { getRegisters, erMethods } = useElectoralRegisters()

  const sortedRegisters = computed(() => {
    return orderBy(getRegisters(meeting.value), ['created'], ['desc']) as ElectoralRegister[]
  })
  const currentElectoralRegister = computed<ElectoralRegister | undefined>(() => {
    return sortedRegisters.value[0]
  })

  const erMethod = computed<ErDefinition | undefined>(() => {
    const m = meetings.get(meeting.value)
    if (!m) return
    return erMethods.find(erm => erm.name === m.er_policy_name)
  })

  const erWeightDecimals = computed(() => {
    return 0
  })

  function toInteger (weight: number) {
    if (erWeightDecimals.value === 0) return weight
    return Math.round(weight * (10 ** erWeightDecimals.value))
  }

  function toFractions (weight: number) {
    if (erWeightDecimals.value === 0) return weight
    return weight / (10 ** erWeightDecimals.value)
  }

  return {
    erMethod,
    erWeightDecimals,
    sortedRegisters,
    currentElectoralRegister,
    toInteger,
    toFractions
  }
}
