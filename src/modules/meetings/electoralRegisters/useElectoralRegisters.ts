import { reactive } from 'vue'

import { electoralRegisterType } from '../contentTypes'
import { dateify } from '@/utils'

import { ElectoralRegister, ErDefinition } from './types'

// Needs reactive, so that permission checks are run again when an ER is inserted.
const registers = reactive<Map<number, ElectoralRegister | null>>(new Map())

electoralRegisterType
  .updateMap(registers as Map<number, ElectoralRegister>) // Don't bother about that null value. That's ok.

const erMethods: ErDefinition[] = [
  {
    allowManual: false,
    name: 'auto_before_poll'
  },
  {
    allowManual: true,
    name: 'presence_check'
  },
  {
    allowManual: true,
    hasWeight: true,
    name: 'manual'
  },
  {
    allowManual: false,
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

  function getRegisters (meeting: number) {
    return [...registers.values()].filter(er => er?.meeting === meeting) as ElectoralRegister[]
  }

  function getRegister (pk: number) {
    if (!registers.has(pk)) fetchRegister(pk) // Will set register to null while getting
    return registers.get(pk) as ElectoralRegister | null
  }

  return {
    erMethods,
    clearRegisters,
    getRegister,
    getRegisters,
    fetchRegisters
  }
}
