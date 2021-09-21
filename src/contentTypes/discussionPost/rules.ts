import { meetings } from '@/composables/useMeetings'
import { agendaItems } from '@/modules/agendas/useAgenda'

import { isAuthor } from '../rules'
import agendaRules from '../agendaItem/rules'
import meetingRules from '../meeting/rules'

import { AgendaItem, DiscussionPost, Predicate } from '../types'

const canAdd: Predicate = (agendaItem: AgendaItem) => {
  const meeting = meetings.get(agendaItem.meeting)
  return !agendaRules.isArchived(agendaItem) && (
    meetingRules.isModerator(meeting) || (
      !agendaRules.isPrivate(agendaItem) && !agendaRules.isDiscussionBlocked(agendaItem) && meetingRules.isDiscusser(meeting)
  ))
}

const canChange: Predicate = (post: DiscussionPost) => {
  const agendaItem = agendaItems.get(post.agenda_item)
  const meeting = agendaItem && meetings.get(agendaItem.meeting)
  return !meetingRules.isArchived(meeting) && meetingRules.isModerator(meeting)
}

const canDelete: Predicate = (post: DiscussionPost) => {
  const agendaItem = agendaItems.get(post.agenda_item)
  const meeting = agendaItem && meetings.get(agendaItem.meeting)
  return !meetingRules.isArchived(meeting) && (meetingRules.isModerator(meeting) || isAuthor(post))
}

export default {
  canAdd,
  canChange,
  canDelete
}
