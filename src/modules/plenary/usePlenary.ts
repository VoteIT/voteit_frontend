import { ComputedRef, computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { StorageSerializers, useStorage } from '@vueuse/core'

import { ProposalState, Proposal, isProposal } from '@/modules/proposals/types'
import useProposalStore from '@/modules/proposals/useProposalStore'
import useRoom from '../rooms/useRoom'

export const plenaryViewMode = useStorage<'discussion' | 'decisions' | 'split'>(
  'plenary:viewMode',
  'decisions',
  localStorage
)

/**
 * Whether broadcast should follow the senders agenda item or wait for sender to broadcast item.
 */
export const broadcastFollowAgendaItem = useStorage<boolean | undefined>(
  'broadcast:followAgendaItem',
  undefined,
  localStorage,
  { serializer: StorageSerializers.object }
)

const stateFilter = ref([ProposalState.Published, ProposalState.Voting])
const selectedProposalIds = ref<number[]>([])

export function isSelectedProposal(proposal: Proposal) {
  return selectedProposalIds.value.includes(proposal.pk)
}

export function isProposalInPool(proposal: Proposal) {
  return !isSelectedProposal(proposal)
}

/**
 * Filter proposal states based in current state filter
 */
function filterProposalStates(p: Proposal) {
  return !stateFilter.value.length || stateFilter.value.includes(p.state)
}

export default function usePlenary(agendaItem: ComputedRef<number>) {
  const route = useRoute()
  const { getAiProposals, getProposal } = useProposalStore()
  const { isBroadcasting, meetingRoom, getRoomRoute } = useRoom()

  type Tab = 'discussion' | 'decisions' | 'split'

  function getPlenaryRoute(params: { aid?: number; tab?: Tab }) {
    return getRoomRoute('room:broadcast', {
      aid: agendaItem.value,
      tab: currentTab.value,
      ...params
    })
  }

  const currentTab = computed(() => (route.params.tab ?? 'decisions') as Tab)

  watch(currentTab, (tab) => {
    plenaryViewMode.value = tab
  })

  /**
   * Is the current user broadcasting this AI.
   * If we're in follow mode, assume yes if broadcasting.
   */
  const isBroadcastingAI = computed(
    () =>
      isBroadcasting.value &&
      (broadcastFollowAgendaItem.value ||
        meetingRoom.value?.agenda_item === agendaItem.value)
  )

  function selectProposal(proposal: number) {
    if (selectedProposalIds.value.includes(proposal)) return
    selectedProposalIds.value = [...selectedProposalIds.value, proposal]
  }

  function selectProposalIds(proposals: number[]) {
    selectedProposalIds.value = proposals
  }

  function deselectProposal(proposal: number) {
    selectedProposalIds.value = selectedProposalIds.value.filter(
      (pk) => proposal !== pk
    )
  }
  const selectedProposals = computed(() =>
    selectedProposalIds.value.map(getProposal).filter(isProposal)
  )

  const filteredProposals = computed(() =>
    getAiProposals(agendaItem.value, filterProposalStates)
  )

  return {
    broadcastFollowAgendaItem,
    currentTab,
    isBroadcastingAI,
    filteredProposals,
    selectedProposalIds,
    selectedProposals,
    stateFilter,
    deselectProposal,
    filterProposalStates,
    getPlenaryRoute,
    selectProposal,
    selectProposalIds
  }
}
