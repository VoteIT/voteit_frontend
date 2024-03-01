import TypedEvent from '@/utils/TypedEvent'

export interface ProposalSelection {
  room: number
  proposal: number
  start: number
  end: number
}

export const proposalSelectionEvent = new TypedEvent<ProposalSelection>()
