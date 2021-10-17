import { meetings } from '@/modules/meetings/useMeetings'
import { agendaItems } from '@/modules/agendas/useAgenda'

import { isAuthor } from '../../contentTypes/rules'
import agendaRules from '../../contentTypes/agendaItem/rules'
import meetingRules from '../../contentTypes/meeting/rules'

import { DiscussionPost } from './types'
import { AgendaItem } from '@/modules/agendas/types'

export function canAddDiscussionPost (agendaItem: AgendaItem): boolean {
  const meeting = meetings.get(agendaItem.meeting)
  return !agendaRules.isArchived(agendaItem) && (
    meetingRules.isModerator(meeting) || (
      !agendaRules.isPrivate(agendaItem) && !agendaRules.isDiscussionBlocked(agendaItem) && meetingRules.isDiscusser(meeting)
  ))
}

export function canChangeDiscussionPost (post: DiscussionPost): boolean {
  const agendaItem = agendaItems.get(post.agenda_item)
  const meeting = agendaItem && meetings.get(agendaItem.meeting)
  return !meetingRules.isArchived(meeting) && meetingRules.isModerator(meeting)
}

export function canDeleteDiscussionPost (post: DiscussionPost): boolean {
  const agendaItem = agendaItems.get(post.agenda_item)
  const meeting = agendaItem && meetings.get(agendaItem.meeting)
  return !meetingRules.isArchived(meeting) && (meetingRules.isModerator(meeting) || isAuthor(post))
}
