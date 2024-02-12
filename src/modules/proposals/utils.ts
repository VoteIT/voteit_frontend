import { UNRESOLVED_STATES } from './constants'
import type { ProposalState } from './types'

export function isUnresolvedState(state: ProposalState) {
  return UNRESOLVED_STATES.includes(state)
}
