import { agendaItems } from '@/modules/agendas/useAgenda'

import { isAuthor } from '../../contentTypes/rules'

import { DiscussionPost } from './types'
import { AgendaItem } from '@/modules/agendas/types'
import { isArchivedAI, isDiscussionBlocked, isPrivateAI } from '../agendas/rules'
import { isArchivedMeeting, isDiscusser, isModerator } from '../meetings/rules'

export function canAddDiscussionPost (agendaItem: AgendaItem): boolean {
  return !isArchivedAI(agendaItem) && (
    !!isModerator(agendaItem.meeting) || (
      !isPrivateAI(agendaItem) && !isDiscussionBlocked(agendaItem) && !!isDiscusser(agendaItem.meeting)
  ))
}

export function canChangeDiscussionPost (post: DiscussionPost): boolean {
  const agendaItem = agendaItems.get(post.agenda_item)
  return !isArchivedMeeting(agendaItem?.meeting) && !!isModerator(agendaItem?.meeting)
}

export function canDeleteDiscussionPost (post: DiscussionPost): boolean {
  const agendaItem = agendaItems.get(post.agenda_item)
  return !isArchivedMeeting(agendaItem?.meeting) && (isModerator(agendaItem?.meeting) || isAuthor(post))
}
