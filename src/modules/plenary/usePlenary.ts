import { ref } from 'vue'

import { ProposalState } from '@/contentTypes/proposal/workflowStates'
import { Proposal } from '@/contentTypes/types'

const stateFilter = ref([ProposalState.Published])

export default function usePlenary () {
  const filterProposalStates = (p: Proposal) => !stateFilter.value.length || stateFilter.value.includes(p.state)

  return {
    stateFilter,
    filterProposalStates
  }
}
