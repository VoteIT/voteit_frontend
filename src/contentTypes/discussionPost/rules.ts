import { agendaItems } from '@/composables/meeting/useAgenda'
import { meetings } from '@/composables/useMeetings'

import { isAuthor } from '../rules'
import agendaRules from '../agendaItem/rules'
import meetingRules from '../meeting/rules'

import { AgendaItem, DiscussionPost } from '../types'

function canAdd (agendaItem: AgendaItem) {
  const meeting = meetings.get(agendaItem.meeting)
  return !agendaRules.isArchived(agendaItem) && (
    meetingRules.isModerator(meeting) || (
      !agendaRules.isPrivate(agendaItem) && !agendaRules.isDiscussionBlocked(agendaItem) && meetingRules.isDiscusser(meeting)
  ))
}

function canChange (post: DiscussionPost) {
  const agendaItem = agendaItems.get(post.agenda_item)
  const meeting = agendaItem && meetings.get(agendaItem.meeting)
  return !meetingRules.isArchived(meeting) && meetingRules.isModerator(meeting)
}

function canDelete (post: DiscussionPost) {
  const agendaItem = agendaItems.get(post.agenda_item)
  const meeting = agendaItem && meetings.get(agendaItem.meeting)
  return !meetingRules.isArchived(meeting) && (meetingRules.isModerator(meeting) || isAuthor(post))
}

export default {
  canAdd,
  canChange,
  canDelete
}
