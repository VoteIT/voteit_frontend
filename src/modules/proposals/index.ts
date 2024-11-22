import { flatMap, sortBy } from 'lodash'
import { getApiLink } from '@/utils/restApi'

import { meetingExportPlugins } from '../meetings/registry'
import { agendaItemType } from '../agendas/contentTypes'
import { AgendaTransition } from '../agendas/types'
import { anyProposal } from './useProposals'
import { UNRESOLVED_STATES } from './constants'
import { plenarySuggestions } from '../plenary/registry'
import useTextDocuments from './useTextDocuments'
import { Proposal } from './types'

function getDownloadFormat(meeting: number, format: 'csv' | 'json') {
  return {
    format,
    url: getApiLink(`export-proposals/${meeting}/${format}/`)
  }
}

meetingExportPlugins.register({
  id: 'proposals',
  getExports(t, meetingId) {
    return [
      {
        formats: [
          getDownloadFormat(meetingId, 'csv'),
          getDownloadFormat(meetingId, 'json')
        ]
      }
    ]
  },
  getTitle(t) {
    return t('proposal.proposals')
  }
})

agendaItemType.transitions.registerGuard(AgendaTransition.Close, (obj, t) => {
  if (
    anyProposal(
      (p) => p.agenda_item === obj.pk && UNRESOLVED_STATES.includes(p.state)
    )
  )
    return { text: t('proposal.agendaItemHasUnresolved') }
})

function getFirstTagProposalCount(proposals: Proposal[]) {
  const { aiProposalTexts } = useTextDocuments(proposals[0].agenda_item)
  const tags = aiProposalTexts.value.flatMap((doc) =>
    doc.paragraphs.map((p) => p.tag)
  )
  for (const tag of tags) {
    const count = proposals.filter((p) => p.tags.includes(tag)).length
    if (count) return { tag, count }
  }
}

plenarySuggestions.register({
  getTags(proposals) {
    const suggestion = getFirstTagProposalCount(proposals)
    return suggestion ? [suggestion] : []
  },
  getTitle(t) {
    return t('plenary.nextParagraph')
  },
  style: '--tag-scale: 1.4'
})

plenarySuggestions.register({
  getTags(proposals) {
    const textSuggested = getFirstTagProposalCount(proposals)?.tag
    const propIdTags = new Set(proposals.map((p) => p.prop_id))
    const otherTags = new Set(
      proposals
        .flatMap((p) => p.tags)
        .filter((tag) => tag !== textSuggested && !propIdTags.has(tag))
    )
    return sortBy(
      [...otherTags].map((tag) => ({
        tag,
        count: proposals.filter((p) => p.tags.includes(tag)).length
      })),
      'tag'
    )
  },
  getTitle(t) {
    return t('plenary.otherTags')
  }
})
