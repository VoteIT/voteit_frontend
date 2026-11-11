import { shallowRef } from 'vue'

import restApi from '@/utils/restApi'

/** A closed meeting where the user's votes can't be cleared yet */
export interface PendingVoteClearing {
  readonly meeting: number
  /** ISO datetime when the retention period is over */
  readonly clearable_after: string
  readonly votes: number
}

export interface ClearVotesResult {
  readonly cleared: number
  readonly pending: PendingVoteClearing[]
}

/**
 * Clear the content of the user's own votes, where the retention period is
 * over. Cleared votes come back over the socket, so the poll store follows.
 */
export default function useClearVotes() {
  const clearing = shallowRef(false)
  const result = shallowRef<ClearVotesResult>()

  async function clear() {
    clearing.value = true
    try {
      result.value = await restApi.post<ClearVotesResult>('votes/clear/')
    } finally {
      clearing.value = false
    }
  }

  return { clear, clearing, result }
}
