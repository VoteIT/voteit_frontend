import { MeetingRole, MeetingState } from '../meetings/types'
import { ProposalState } from '../proposals/types'

export interface PreviewResponse {
  groups: {
    body: string
    created: string
    groupid: string
    members: unknown[]
    modified: string
    pk: string
    post_as: boolean
    show_on_speaker: boolean
    tags: string[]
    title: string
  }[]
  agenda_items: {
    block_discussion: boolean
    block_proposals: boolean
    body: string
    created: string
    discussions: {
      as_group: boolean
      author: string
      body: string
      created: string
      modified: string
      meeting_group?: string
      pk: string
      tags: string[]
    }[]
    modified: string
    proposals: {
      as_group: boolean
      author: string
      body: string
      created: string
      modified: string
      meeting_group?: string
      pk: string
      prop_id: string
      state: ProposalState
      tags: string[]
    }[]
    pk: string
    state?: MeetingState
    tags: string[]
    text_documents: unknown[]
    title: string
  }[]
  meta: {
    version: number
    created: string
    title: string
    description: string
  }
  notes: unknown[]
  reaction_buttons: {
    title: string
    description: string
    icon: string
    color: string
    target: number | null
    order: number
    change_roles: MeetingRole[]
    list_roles: MeetingRole[]
    active: boolean
    allowed_models: ('discussion_post' | 'proposal')[]
    on_presentation: boolean
    on_vote: boolean
    vote_template: boolean
    flag_mode: boolean
    reactions: unknown[]
  }[]
  signature_valid: boolean
  size_limit: number
}
