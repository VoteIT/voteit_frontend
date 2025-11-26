import { isAuthor } from '../../contentTypes/rules'

import {
  isArchivedAI,
  isDiscussionBlocked,
  isPrivateAI
} from '../agendas/rules'
import { AgendaItem } from '../agendas/types'
import useAgendaStore from '../agendas/useAgendaStore'
import { isArchivedMeeting, isDiscusser, isModerator } from '../meetings/rules'
import { DiscussionPost } from './types'

export function canAddDiscussionPost(agendaItem: AgendaItem): boolean {
  return (
    !isArchivedAI(agendaItem) &&
    (!!isModerator(agendaItem.meeting) ||
      (!isPrivateAI(agendaItem) &&
        !isDiscussionBlocked(agendaItem) &&
        !!isDiscusser(agendaItem.meeting)))
  )
}

export function canChangeDiscussionPost(post: DiscussionPost): boolean {
  const agendaItem = useAgendaStore().getAgendaItem(post.agenda_item)
  return (
    !isArchivedMeeting(agendaItem?.meeting) &&
    !!isModerator(agendaItem?.meeting)
  )
}

export function canDeleteDiscussionPost(post: DiscussionPost): boolean {
  const agendaItem = useAgendaStore().getAgendaItem(post.agenda_item)
  return (
    !isArchivedMeeting(agendaItem?.meeting) &&
    (isModerator(agendaItem?.meeting) || isAuthor(post))
  )
}
