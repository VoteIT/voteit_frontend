import { computed, reactive, readonly, ref } from 'vue'

import { ProposalState } from '@/contentTypes/proposal/workflowStates'
import { Proposal } from '@/contentTypes/types'
import useProposals from '@/modules/proposals/useProposals'

const { getProposal, iterProposals } = useProposals()

const stateFilter = ref([ProposalState.Published])
const selectedProposalIds = reactive<number[]>([])

export default function usePlenary () {
  const filterProposalStates = (p: Proposal) => !stateFilter.value.length || stateFilter.value.includes(p.state)

  function selectProposal (p: Proposal) {
    selectedProposalIds.push(p.pk)
  }
  function deselectProposal (p: Proposal) {
    const index = selectedProposalIds.indexOf(p.pk)
    if (index !== -1) selectedProposalIds.splice(index, 1)
  }
  function clearSelected () {
    selectedProposalIds.length = 0
  }
  const selectedProposals = computed(() => {
    return readonly(selectedProposalIds.map(pk => getProposal(pk)).filter(Boolean) as Proposal[])
  })

  function selectTag (tagName: string) {
    selectedProposalIds.length = 0
    for (const p of iterProposals(p => p.tags.includes(tagName))) {
      selectedProposalIds.push(p.pk)
    }
  }

  return {
    selectedProposalIds: readonly(selectedProposalIds),
    selectedProposals,
    stateFilter,
    clearSelected,
    deselectProposal,
    filterProposalStates,
    selectProposal,
    selectTag
  }
}
