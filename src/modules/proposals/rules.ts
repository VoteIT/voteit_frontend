import { agendaItems } from '../agendas/useAgenda'

import { isAIModerator, isFinishedAI } from '../agendas/rules'

import { TextDocument } from './contentTypes'
import useProposals from './useProposals'
import { AgendaItem } from '../agendas/types'
import useTextDocuments from './useTextDocuments'

const { iterProposals } = useProposals()
const { textDocuments } = useTextDocuments()

export function documentHasProposals (doc: TextDocument): boolean {
  const tags = doc.paragraphs.map(p => p.tag)
  const generator = iterProposals(prop => {
    return prop.agenda_item === doc.agenda_item &&
           tags.some(tag => prop.tags.includes(tag))
  })
  return !!generator.next().value
}

function agendaItemHasDocuments (ai: AgendaItem): boolean {
  for (const doc of textDocuments.values()) {
    if (doc.agenda_item === ai.pk) return true
  }
  return false
}

export function canAddDocument (ai: AgendaItem): boolean {
  return isAIModerator(ai) &&
         !isFinishedAI(ai) &&
         !agendaItemHasDocuments(ai) // Temporary rule
}

export function canChangeDocument (doc: TextDocument): boolean {
  const ai = agendaItems.get(doc.agenda_item)
  return !!ai && isAIModerator(ai) && !isFinishedAI(ai) && !documentHasProposals(doc)
}

export const canDeleteDocument = canChangeDocument
