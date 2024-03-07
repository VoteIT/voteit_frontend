export interface IMeetingRoom {
  pk: number
  open: boolean // Currently broadcasting
  agenda_item: number | null
  body?: string
  handler?: number // Currently broadcasting user
  meeting: number
  poll: null | number
  send_sls: boolean
  send_proposals: boolean
  show_ballot: boolean
  show_time: boolean
  title: string
}

export interface IRoomHighlight {
  pk: number
  highlighted: number[] // Proposal ids
}

interface ProposalBaseHighlight {
  room: number
  proposal?: number
}

interface ProposalTextHighlight extends ProposalBaseHighlight {
  proposal: number
  start: number
  end: number
}

export type ProposalHighlight = ProposalBaseHighlight | ProposalTextHighlight

export function isTextHighlight(
  selection: ProposalHighlight
): selection is ProposalTextHighlight {
  return 'start' in selection
}
