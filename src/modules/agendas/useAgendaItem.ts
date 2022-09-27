import { computed, Ref } from 'vue'

import { slugify } from '@/utils'

import useMeeting from '../meetings/useMeeting'
import { canAddDiscussionPost as _canAddDiscussionPost } from '../discussions/rules'
import { canAddPoll as _canAddPoll } from '../polls/rules'
import { canAddProposal as _canAddProposal, canAddDocument as _canAddDocument, getProposalBlockReason } from '../proposals/rules'

import { canChangeAgendaItem as canChange } from './rules'

import useAgenda from './useAgenda'
import usePolls from '../polls/usePolls'

export default function useAgendaItem (agendaId: Ref<number | undefined>) {
  const { meetingId, meetingPath } = useMeeting()
  const { getAgendaItem } = useAgenda(meetingId)
  const agendaItem = computed(() => typeof agendaId.value === 'number' ? getAgendaItem(agendaId.value) : undefined)
  const { allPollTitles } = usePolls()

  const agendaItemPath = computed(() => {
    if (!agendaId.value) return
    return `${meetingPath.value}/a/${agendaId.value}/${slugify(agendaItem.value ? agendaItem.value.title : '-')}`
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

  const canAddPoll = computed(() => agendaItem.value && _canAddPoll(agendaItem.value))

  const canAddProposal = computed(() => {
    if (!agendaItem.value) return false
    return _canAddProposal(agendaItem.value)
  })

  const proposalBlockReason = computed(() => {
    if (!agendaItem.value) return
    return getProposalBlockReason(agendaItem.value)
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
    agendaItem,
    agendaItemPath,
    canAddDiscussionPost,
    canAddDocument,
    canAddPoll,
    canAddProposal,
    canChangeAgendaItem,
    nextPollTitle,
    proposalBlockReason
  }
}
