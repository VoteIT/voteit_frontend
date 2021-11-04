import { computed, reactive, ref } from 'vue'
import { orderBy } from 'lodash'

import { ElectoralRegister } from '@/contentTypes/types'

import { electoralRegisterType } from './contentTypes'
import { dateify } from '@/utils'

// Needs reactive, so that permission checks are run again when an ER is inserted.
// const registers = reactive<Map<number, Set<number> | null>>(new Map())
const registers = reactive<Map<number, ElectoralRegister | null>>(new Map())

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
      registers.set(pk, dateify(data))
    } catch {
      registers.delete(pk) // Enables trying again.
    }
  }

  async function fetchRegisters (meeting: number) {
    try {
      const { data } = await electoralRegisterType.api.list({ meeting })
      for (const er of data) {
        registers.set(er.pk, dateify(er))
      }
    } catch {} // TODO
  }

  const sortedRegisters = computed(() => {
    return orderBy([...registers.values()], ['created'], ['desc'])
  })

  function getRegister (pk: number) {
    if (!registers.has(pk)) fetchRegister(pk) // Will set register to null while getting
    return registers.get(pk) as ElectoralRegister | null
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
    return Object.fromEntries(erMethods.value.map(({ name, value }) => [value, name]))
  })

  return {
    erMethods,
    erOptions,
    sortedRegisters,
    getRegister,
    fetchRegisters
  }
}
