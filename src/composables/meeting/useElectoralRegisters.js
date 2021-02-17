import { reactive } from 'vue'
import useContentApi from '../useContentApi'

// Needs reactive, so that permission checks are run again when an ER is inserted.
const registers = reactive(new Map())

export default function useElectoralRegisters () {
  const registerApi = useContentApi('poll.electoralregister')
  function getRegister (pk) {
    if (registers.has(pk)) {
      return registers.get(pk)
    } else {
      registers.set(pk, null) // If it has any value, will not fetch again
      registerApi.retrieve(pk)
        .then(({ data }) => {
          registers.set(pk, new Set(data.voters))
        })
        .catch(_ => {
          registers.delete(pk) // Enables trying again.
        })
    }
  }

  return {
    getRegister
  }
}
