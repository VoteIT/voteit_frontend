import { computed } from 'vue'

import { slugify } from '@/utils'
import useMeeting from '@/modules/meetings/useMeeting'
import { canAddProposal as _canAddProposal, canAddDocument as _canAddDocument } from '@/modules/proposals/rules'
import { canAddDiscussionPost as _canAddDiscussionPost } from '@/modules/discussions/rules'
import { canChangeAgendaItem as canChange } from './rules'

import useAgenda from './useAgenda'
import usePolls from '../polls/usePolls'

export default function useAgendaItem () {
  const { agendaId, agendaItem } = useAgenda()
  const { meetingPath } = useMeeting()
  const { allPollTitles } = usePolls()

  const agendaItemPath = computed(() => {
    if (!meetingPath.value || !agendaItem.value) return
    return `${meetingPath.value}/a/${agendaItem.value.pk}/${slugify(agendaItem.value.title)}`
  })

  const nextPollTitle = computed(() => {
    if (!agendaItem.value) return
    for (let n = 1; true; n++) {
      const title = `${agendaItem.value?.title} ${n}`
      if (!allPollTitles.value.includes(title)) return title
    }
  })

  const canChangeAgendaItem = computed(() => {
    if (!agendaItem.value) return false
    return canChange(agendaItem.value)
  })

  const canAddProposal = computed(() => {
    if (!agendaItem.value) return false
    return _canAddProposal(agendaItem.value)
  })

  const canAddDiscussionPost = computed(() => {
    if (!agendaItem.value) return false
    return _canAddDiscussionPost(agendaItem.value)
  })

  const canAddDocument = computed(() => {
    if (!agendaItem.value) return false
    return _canAddDocument(agendaItem.value)
  })

  return {
    agendaId,
    agendaItem,
    agendaItemPath,
    canAddDiscussionPost,
    canAddDocument,
    canAddProposal,
    canChangeAgendaItem,
    nextPollTitle
  }
}
