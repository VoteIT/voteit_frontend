export interface IMeetingRoom {
  pk: number
  open: boolean // Currently broadcasting
  agenda_item: number | null
  body?: string
  handler?: number // Currently broadcasting user
  meeting: number
  send_sls: boolean
  send_proposals: boolean
  show_time: boolean
  title: string
}

export interface IRoomHighlight {
  pk: number
  agenda_item: number | null
  highlighted: number[] // Proposal ids
}
