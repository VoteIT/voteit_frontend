import ContentType from '@/contentTypes/ContentType'
import { Proposal, ProposalState } from './types'
import { ThemeColor } from '@/utils/types'

export interface TextParagraph {
  paragraph_id: number
  pk: number
  body: string
  tag: string
}

export interface ProposalText {
  title: string
  body: string
  created: string
  modified: string
  pk: number
  agenda_item: number
  paragraphs: TextParagraph[]
  base_tag: string
}

export const proposalType = new ContentType<
  Proposal,
  | 'approve'
  | 'deny'
  | 'lock_for_vote'
  | 'mark_unhandled'
  | 'publish'
  | 'retract'
>({
  states: {
    name: 'ProposalStateMachine',
    meta: {
      [ProposalState.Published]: {
        color: ThemeColor.Primary,
        icon: 'mdi-eye',
        translate: (t, count = 1) => t('proposal.workflow.published', count)
      },
      [ProposalState.Retracted]: {
        color: ThemeColor.Secondary,
        icon: 'mdi-undo-variant',
        translate: (t, count = 1) => t('proposal.workflow.retracted', count)
      },
      [ProposalState.Voting]: {
        color: ThemeColor.Info,
        icon: 'mdi-vote',
        translate: (t, count = 1) => t('proposal.workflow.voting', count)
      },
      [ProposalState.Approved]: {
        color: ThemeColor.Success,
        icon: 'mdi-check-circle-outline',
        translate: (t, count = 1) => t('proposal.workflow.approved', count)
      },
      [ProposalState.Denied]: {
        color: ThemeColor.Warning,
        icon: 'mdi-close-circle-outline',
        translate: (t, count = 1) => t('proposal.workflow.denied', count)
      },
      [ProposalState.Unhandled]: {
        color: ThemeColor.Secondary,
        icon: 'mdi-help-circle-outline',
        translate: (t, count = 1) => t('proposal.workflow.unhandled', count)
      }
    }
  },
  name: 'proposal',
  restEndpoint: 'proposals/'
})

export const proposalTextType = new ContentType<ProposalText>({
  name: 'text_document',
  restEndpoint: 'text-documents/'
})
