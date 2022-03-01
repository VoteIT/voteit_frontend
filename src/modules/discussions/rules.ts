import { meetings } from '@/modules/meetings/useMeetings'
import { agendaItems } from '@/modules/agendas/useAgenda'

import { isAuthor } from '../../contentTypes/rules'

import { DiscussionPost } from './types'
import { AgendaItem } from '@/modules/agendas/types'
import { isArchivedAI, isDiscussionBlocked, isPrivateAI } from '../agendas/rules'
import { isArchivedMeeting, isDiscusser, isModerator } from '../meetings/rules'

export function canAddDiscussionPost (agendaItem: AgendaItem): boolean {
  const meeting = meetings.get(agendaItem.meeting)
  return !isArchivedAI(agendaItem) && (
    !!isModerator(meeting) || (
      !isPrivateAI(agendaItem) && !isDiscussionBlocked(agendaItem) && !!isDiscusser(meeting)
  ))
}

export function canChangeDiscussionPost (post: DiscussionPost): boolean {
  const agendaItem = agendaItems.get(post.agenda_item)
  const meeting = agendaItem && meetings.get(agendaItem.meeting)
  return !isArchivedMeeting(meeting) && !!isModerator(meeting)
}

export function canDeleteDiscussionPost (post: DiscussionPost): boolean {
  const agendaItem = agendaItems.get(post.agenda_item)
  const meeting = agendaItem && meetings.get(agendaItem.meeting)
  return !isArchivedMeeting(meeting) && (isModerator(meeting) || isAuthor(post))
}
