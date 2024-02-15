import { ComputedRef, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ProposalState, Proposal, isProposal } from '@/modules/proposals/types'
import useProposals from '@/modules/proposals/useProposals'
import useRoom from '../rooms/useRoom'

const { getAgendaProposals, getProposal } = useProposals()

const stateFilter = ref([ProposalState.Published, ProposalState.Voting])
const selectedProposalIds = ref<number[]>([])

export function isSelectedProposal(proposal: Proposal) {
  return selectedProposalIds.value.includes(proposal.pk)
}

export function isProposalInPool(proposal: Proposal) {
  return !isSelectedProposal(proposal)
}

function filterProposalStates(p: Proposal) {
  return !stateFilter.value.length || stateFilter.value.includes(p.state)
}

export default function usePlenary(
  meetingId: ComputedRef<number>,
  agendaItem: ComputedRef<number>
) {
  const route = useRoute()
  const router = useRouter()
  const { roomId } = useRoom()

  type Tab = 'discussion' | 'decisions'

  const currentTab = computed({
    get() {
      return route.params.tab as Tab
    },
    set(tab) {
      router.push(getPlenaryRoute({ tab }))
    }
  })

  function getPlenaryRoute(params: {
    roomId?: number
    tab?: Tab
    aid?: number
  }) {
    return {
      name: 'Plenary',
      params: {
        id: meetingId.value,
        aid: agendaItem.value,
        roomId: roomId.value,
        tab: currentTab.value,
        ...params
      }
    }
  }

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
    getAgendaProposals(agendaItem.value, filterProposalStates)
  )

  return {
    currentTab,
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
