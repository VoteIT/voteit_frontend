import { reactive } from 'vue'
import electoralRegisterType from '@/contentTypes/electoralRegister'

import { ElectoralRegister } from '@/contentTypes/types'

// Needs reactive, so that permission checks are run again when an ER is inserted.
const registers = reactive<Map<number, Set<number> | null>>(new Map())
const registerApi = electoralRegisterType.useContentApi()

export default function useElectoralRegisters () {
  function getRegister (pk: number) {
    if (registers.has(pk)) {
      return registers.get(pk)
    } else {
      registers.set(pk, null) // If it has any value, will not fetch again
      registerApi.retrieve(pk)
        .then(({ data }: { data: ElectoralRegister }) => {
          registers.set(pk, new Set(data.voters))
        })
        .catch(() => {
          registers.delete(pk) // Enables trying again.
        })
    }
  }

  return {
    getRegister
  }
}
