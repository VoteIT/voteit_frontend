import { UNRESOLVED_STATES } from './constants'
import type { Proposal } from './types'

export function isUnresolved({ state }: Pick<Proposal, 'state'>) {
  return UNRESOLVED_STATES.includes(state)
}
