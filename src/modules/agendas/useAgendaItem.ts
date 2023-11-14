import { any } from 'itertools'
import type { Dictionary } from 'lodash'
import { computed, Ref } from 'vue'

import { autoEllipsis, slugify } from '@/utils'

import useMeeting from '../meetings/useMeeting'
import { canAddDiscussionPost as _canAddDiscussionPost } from '../discussions/rules'
import { canAddPoll as _canAddPoll } from '../polls/rules'
import usePolls from '../polls/usePolls'
import {
  canAddProposal as _canAddProposal,
  canAddDocument as _canAddDocument,
  getProposalBlockReason
} from '../proposals/rules'
import { iterProposals } from '../proposals/useProposals'
import { isUnresolvedState } from '../proposals/utils'

import { canChangeAgendaItem as canChange } from './rules'

import useAgenda from './useAgenda'

export default function useAgendaItem(agendaId: Ref<number | undefined>) {
  const { meetingId, getMeetingRoute } = useMeeting()
  const { getAgendaItem, getAgendaBody } = useAgenda(meetingId)
  const agendaItem = computed(() =>
    typeof agendaId.value === 'number'
      ? getAgendaItem(agendaId.value)
      : undefined
  )
  const agendaBody = computed(() =>
    typeof agendaId.value === 'number'
      ? getAgendaBody(agendaId.value)?.body
      : undefined
  )
  const { allPollTitles } = usePolls()

  function getAgendaItemRoute(
    name: string = 'agendaItem',
    params?: Dictionary<string | number>
  ) {
    if (!agendaId.value) return
    return getMeetingRoute(name, {
      aid: agendaId.value,
      aslug: slugify(agendaItem.value?.title),
      ...params
    })
  }
  const agendaItemRoute = computed(() => getAgendaItemRoute())

  const nextPollTitle = computed(() => {
    if (!agendaItem.value) return ''
    for (let n = 1; true; n++) {
      const addLength = String(n).length + 1 // Add room for space char
      const title = `${autoEllipsis(
        agendaItem.value.title,
        70 - addLength
      )} ${n}`
      if (!allPollTitles.value.includes(title)) return title
    }
  })

  const canChangeAgendaItem = computed(() => {
    if (!agendaItem.value) return false
    return canChange(agendaItem.value)
  })

  const canAddPoll = computed(
    () => agendaItem.value && _canAddPoll(agendaItem.value)
  )

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

  const hasUnresolvedProposals = computed(() =>
    any(
      iterProposals(
        (p) => p.agenda_item === agendaId.value && isUnresolvedState(p.state)
      )
    )
  )

  return {
    agendaItem,
    agendaBody,
    agendaItemRoute,
    canAddDiscussionPost,
    canAddDocument,
    canAddPoll,
    canAddProposal,
    canChangeAgendaItem,
    hasUnresolvedProposals,
    nextPollTitle,
    proposalBlockReason,
    getAgendaItemRoute
  }
}
