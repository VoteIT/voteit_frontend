import { computed, Ref } from 'vue'

import useElectoralRegisters from './useElectoralRegisters'

export default function useElectoralRegister(pk: Ref<number | undefined>) {
  const { getRegister, erMethods } = useElectoralRegisters()

  const electoralRegister = computed(() => {
    if (!pk.value) return
    return getRegister(pk.value)
  })

  const erMethod = computed(
    () =>
      erMethods.value?.find(
        (erm) => erm.name === electoralRegister.value?.source
      )
  )
  const erMethodWeighted = computed(() => erMethod.value?.handles_vote_weight)
  const erWeightDecimals = computed(() => 0)
  const erWeightMultiplier = computed(() => {
    return erWeightDecimals.value === 0 ? 1 : 10 ** erWeightDecimals.value
  })
  const totalWeight = computed(
    () =>
      electoralRegister.value?.weights.reduce(
        (acc, { weight }) => acc + weight,
        0
      )
  )

  const toInteger = (weight: number) =>
    Math.round(weight * erWeightMultiplier.value)
  const toFractions = (weight: number) => weight / erWeightMultiplier.value

  return {
    electoralRegister,
    erMethod,
    erMethodWeighted,
    erWeightDecimals,
    erWeightMultiplier,
    totalWeight,
    toInteger,
    toFractions
  }
}
