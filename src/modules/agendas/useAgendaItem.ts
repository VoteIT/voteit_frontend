import type { Maybe } from 'itertools/types'
import type { Dictionary } from 'lodash'
import { computed, MaybeRef, unref } from 'vue'
import { useRoute } from 'vue-router'

import { autoEllipsis, slugify } from '@/utils'

import useMeeting from '../meetings/useMeeting'
import { canAddDiscussionPost as _canAddDiscussionPost } from '../discussions/rules'
import { canAddPoll as _canAddPoll } from '../polls/rules'
import usePollStore from '../polls/usePollStore'
import { PollState } from '../polls/types'
import {
  canAddProposal as _canAddProposal,
  canAddDocument as _canAddDocument,
  getProposalBlockReason
} from '../proposals/rules'
import useProposalStore from '../proposals/useProposalStore'
import { isUnresolvedState } from '../proposals/utils'

import { canChangeAgendaItem as canChange } from './rules'
import useAgendaStore from './useAgendaStore'
import { AgendaItem } from './types'
import useAgendaTags from './useAgendaTags'

export default function useAgendaItem(agendaId?: MaybeRef<number | undefined>) {
  const { getAgendaItem, getAgendaItems, getAgendaBody, getLastRead } =
    useAgendaStore()
  const { anyProposal } = useProposalStore()
  const route = useRoute()
  const { meeting, meetingId } = useMeeting()

  const _agendaId = computed(() => unref(agendaId) ?? Number(route.params.aid))

  const agendaItem = computed(() => getAgendaItem(_agendaId.value))
  const agendaBody = computed(() => getAgendaBody(_agendaId.value)?.body)
  const pollStore = usePollStore()

  const agendaItemLastRead = computed(
    () => getLastRead(_agendaId.value) ?? new Date(0)
  ) // Default to epoch

  // NEXT / PREVIOUS
  // Get selected agenda tag so that arrow navigation stays within selected tag
  const { selectedAgendaTag } = useAgendaTags(
    computed(() =>
      getAgendaItems((ai) => ai.meeting === agendaItem.value?.meeting)
    )
  )
  function getRelativeAgendaItem(
    agendaItem: AgendaItem,
    positions: number
  ): Maybe<AgendaItem> {
    const agenda = getAgendaItems(
      (ai) =>
        ai.meeting === agendaItem.meeting &&
        (!selectedAgendaTag.value || ai.tags.includes(selectedAgendaTag.value))
    )
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

  const agendaItemRoute = computed(() => ({
    name: 'agendaItem',
    params: {
      id: meetingId.value,
      slug: slugify(meeting.value?.title),
      aid: _agendaId.value,
      aslug: slugify(agendaItem.value?.title)
    }
  }))

  const nextPollTitle = computed(() => {
    if (!agendaItem.value) return ''
    for (let n = 1; true; n++) {
      const addLength = String(n).length + 1 // Add room for space char
      const title = `${autoEllipsis(
        agendaItem.value.title,
        70 - addLength
      )} ${n}`
      if (!pollStore.allPollTitles.includes(title)) return title
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
    pollStore.anyPoll(
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
    proposalBlockReason
    // getAgendaItemRoute
  }
}
