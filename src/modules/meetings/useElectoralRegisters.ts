import { computed, reactive, ref } from 'vue'
import { orderBy } from 'lodash'

import { ElectoralRegister } from '@/contentTypes/types'

import { electoralRegisterType } from './contentTypes'
import { dateify } from '@/utils'
import { useI18n } from 'vue-i18n'

// Needs reactive, so that permission checks are run again when an ER is inserted.
const registers = reactive<Map<number, ElectoralRegister | null>>(new Map())

electoralRegisterType
  .updateMap(registers as Map<number, ElectoralRegister>) // Don't bother about that null value. That's ok.

const erMethods = [
  {
    name: 'auto_before_poll'
  },
  {
    name: 'presence_check'
  },
  {
    name: 'manual'
  },
  {
    name: 'auto_always'
  }
]

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

  function clearRegisters () {
    registers.clear()
  }

  const sortedRegisters = computed(() => {
    return orderBy([...registers.values()].filter(er => er), ['created'], ['desc']) as ElectoralRegister[]
  })

  function getRegister (pk: number) {
    if (!registers.has(pk)) fetchRegister(pk) // Will set register to null while getting
    return registers.get(pk) as ElectoralRegister | null
  }

  const currentElectoralRegister = computed(() => {
    return sortedRegisters.value[0]
  })

  return {
    currentElectoralRegister,
    erMethods,
    sortedRegisters,
    clearRegisters,
    getRegister,
    fetchRegisters
  }
}
