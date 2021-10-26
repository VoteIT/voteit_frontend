import { computed, reactive, ref } from 'vue'

import { electoralRegisterType } from './contentTypes'

// Needs reactive, so that permission checks are run again when an ER is inserted.
const registers = reactive<Map<number, Set<number> | null>>(new Map())

interface ERMethod {
  name: string
  value: string
}
const registerMethods = ref<ERMethod[] | null>(null)

export default function useElectoralRegisters () {
  async function fetchRegister (pk: number) {
    registers.set(pk, null) // If it has any value, will not fetch again
    try {
      const { data } = await electoralRegisterType.api.retrieve(pk)
      registers.set(pk, new Set(data.voters))
    } catch {
      registers.delete(pk) // Enables trying again.
    }
}

  function getRegister (pk: number) {
    if (!registers.has(pk)) fetchRegister(pk) // Will set register to null while getting
    return registers.get(pk) as Set<number> | null
  }

  async function fetchMethods () {
    const { data } = await electoralRegisterType.api.getAction<ERMethod[]>('methods')
    registerMethods.value = data
  }

  const erMethods = computed(() => {
    if (!registerMethods.value) fetchMethods()
    return registerMethods.value
  })

  const erOptions = computed(() => {
    if (!erMethods.value) return {}
    const opts: Record<string, string> = {}
    for (const { name, value } of erMethods.value) {
      opts[name] = value
    }
    return opts
  })

  return {
    erMethods,
    erOptions,
    getRegister
  }
}
