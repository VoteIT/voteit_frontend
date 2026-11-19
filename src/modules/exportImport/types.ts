import { MeetingRole, MeetingState } from '../meetings/types'
import { ProposalState } from '../proposals/types'

/*
 * The preview echoes the import schema (voteit/export_import/schemas.py) with
 * `exclude_unset=True`: any field that has a default there is left out of the
 * response whenever the file doesn't set it. Those fields are optional here —
 * and the nullable ones may also come back as an explicit null.
 */

interface ContentData {
  body?: string
  created?: string | null
  modified?: string | null
  tags?: string[]
  pk?: string | null
}

interface AuthoredContent extends ContentData {
  as_group?: boolean
  author?: string | null
  body: string
  meeting_group?: string | null
}

interface ProposalData extends AuthoredContent {
  prop_id?: string | null
  state?: ProposalState | null
}

interface ReactionData {
  username: string
  agenda_item_id: string
  content_type: string[]
  object_id: string
}

interface ReactionButtonData {
  title?: string
  description?: string
  icon?: string
  color: string
  target?: number | null
  order?: number
  change_roles: MeetingRole[]
  list_roles: MeetingRole[]
  active?: boolean
  allowed_models?: ('discussion_post' | 'proposal')[]
  on_presentation?: boolean
  on_vote?: boolean
  vote_template?: boolean
  flag_mode?: boolean
  reactions?: ReactionData[]
}

interface AgendaItemData extends ContentData {
  title: string
  state?: MeetingState | null
  block_discussion?: boolean
  block_proposals?: boolean
  text_documents?: unknown[]
  proposals?: ProposalData[]
  discussions?: AuthoredContent[]
}

interface MeetingGroupData extends ContentData {
  title?: string
  groupid: string
  votes?: number | null
  members?: string[]
  post_as?: boolean
  show_on_speaker?: boolean
  delegate_to?: string | null
}

interface NoteData {
  user: string
  proposal_id: string
  body?: string
  intent?: string
  created?: string | null
}

export interface PreviewResponse {
  groups?: MeetingGroupData[]
  agenda_items?: AgendaItemData[]
  reaction_buttons?: ReactionButtonData[]
  // Only ever set by a clone preview — a YAML file never carries notes
  notes?: NoteData[]
  meta?: {
    version: number
    created?: string | null
    title?: string
    description?: string
  } | null
  // Only set by a YAML import preview, not a clone preview
  signature_valid?: boolean
  size_limit?: number
}

type WithLists<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]>
}

/** A preview with every list the import panel walks filled in. */
export type Preview = Omit<
  WithLists<PreviewResponse, 'groups' | 'notes'>,
  'agenda_items' | 'reaction_buttons'
> & {
  agenda_items: WithLists<AgendaItemData, 'proposals' | 'discussions'>[]
  reaction_buttons: WithLists<ReactionButtonData, 'reactions'>[]
}

export function normalizePreview(preview: PreviewResponse): Preview {
  return {
    ...preview,
    groups: preview.groups ?? [],
    notes: preview.notes ?? [],
    agenda_items: (preview.agenda_items ?? []).map((item) => ({
      ...item,
      proposals: item.proposals ?? [],
      discussions: item.discussions ?? []
    })),
    reaction_buttons: (preview.reaction_buttons ?? []).map((button) => ({
      ...button,
      reactions: button.reactions ?? []
    }))
  }
}
