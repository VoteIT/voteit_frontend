import type { Maybe } from 'itertools/types'
import type { Dictionary } from 'lodash'
import { computed, MaybeRef, unref } from 'vue'
import { useRoute } from 'vue-router'

import { autoEllipsis, slugify } from '@/utils'

import useMeeting from '../meetings/useMeeting'
import { canAddDiscussionPost as _canAddDiscussionPost } from '../discussions/rules'
import { canAddPoll as _canAddPoll } from '../polls/rules'
import usePolls, { anyPoll } from '../polls/usePolls'
import { PollState } from '../polls/types'
import {
  canAddProposal as _canAddProposal,
  canAddDocument as _canAddDocument,
  getProposalBlockReason
} from '../proposals/rules'
import { anyProposal } from '../proposals/useProposals'
import { isUnresolvedState } from '../proposals/utils'

import { canChangeAgendaItem as canChange } from './rules'
import useAgendaStore from './useAgendaStore'
import { AgendaItem } from './types'

export default function useAgendaItem(agendaId?: MaybeRef<number | undefined>) {
  const { getMeetingRoute } = useMeeting()
  const { getAgendaItem, getAgendaItems, getAgendaBody, getLastRead } =
    useAgendaStore()
  const route = useRoute()

  const _agendaId = computed(() => unref(agendaId) ?? Number(route.params.aid))

  const agendaItem = computed(() =>
    typeof _agendaId.value === 'number'
      ? getAgendaItem(_agendaId.value)
      : undefined
  )
  const agendaBody = computed(() =>
    typeof _agendaId.value === 'number'
      ? getAgendaBody(_agendaId.value)?.body
      : undefined
  )
  const { allPollTitles } = usePolls()

  const agendaItemLastRead = computed(
    () => getLastRead(_agendaId.value) ?? new Date(0)
  ) // Default to epoch

  // NEXT / PREVIOUS
  function getRelativeAgendaItem(
    agendaItem: AgendaItem,
    positions: number
  ): Maybe<AgendaItem> {
    const agenda = getAgendaItems((ai) => ai.meeting === agendaItem.meeting)
    const index = agenda.indexOf(agendaItem)
    return agenda[index + positions]
  }

  const previousAgendaItem = computed(
    () => agendaItem.value && getRelativeAgendaItem(agendaItem.value, -1)
  )
  const nextAgendaItem = computed(
    () => agendaItem.value && getRelativeAgendaItem(agendaItem.value, 1)
  )
  // END OF NEXT / PREVIOUS

  function getAgendaItemRoute(
    name: string = 'agendaItem',
    params?: Dictionary<string | number>
  ) {
    if (!_agendaId.value) return
    return getMeetingRoute(name, {
      aid: _agendaId.value,
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

  const hasOngoingPolls = computed(() =>
    anyPoll(
      (p) => p.agenda_item === _agendaId.value && p.state === PollState.Ongoing
    )
  )

  const hasUnresolvedProposals = computed(() =>
    anyProposal(
      (p) => p.agenda_item === _agendaId.value && isUnresolvedState(p.state)
    )
  )

  return {
    agendaId: _agendaId,
    agendaItem,
    agendaItemLastRead,
    agendaBody,
    agendaItemRoute,
    canAddDiscussionPost,
    canAddDocument,
    canAddPoll,
    canAddProposal,
    canChangeAgendaItem,
    hasOngoingPolls,
    hasUnresolvedProposals,
    nextAgendaItem,
    nextPollTitle,
    previousAgendaItem,
    proposalBlockReason,
    getAgendaItemRoute
  }
}
