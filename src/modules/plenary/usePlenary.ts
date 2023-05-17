import { ComputedRef, computed, reactive, readonly, ref } from 'vue'

import { ProposalState, Proposal } from '@/modules/proposals/types'
import useProposals from '@/modules/proposals/useProposals'

const { getProposal, forProposals } = useProposals()

const stateFilter = ref([ProposalState.Published])
const selectedProposalIds = reactive<number[]>([])

export default function usePlenary (agendaItem: ComputedRef<number>) {
  function filterProposalStates (p: Proposal) {
    return !stateFilter.value.length || stateFilter.value.includes(p.state)
  }

  function selectProposal (p: Pick<Proposal, 'pk'>) {
    selectedProposalIds.push(p.pk)
  }
  function deselectProposal (p: Pick<Proposal, 'pk'>) {
    const index = selectedProposalIds.indexOf(p.pk)
    if (index !== -1) selectedProposalIds.splice(index, 1)
  }
  function clearSelected () {
    selectedProposalIds.length = 0
  }
  const selectedProposals = computed(() => readonly(selectedProposalIds.map(getProposal).filter((p): p is Proposal => !!p)))

  function selectTag (tagName: string) {
    selectedProposalIds.length = 0
    forProposals(
      p => (
        p.agenda_item === agendaItem.value &&
        filterProposalStates(p) &&
        p.tags.includes(tagName)
      ),
      ({ pk }) => { selectedProposalIds.push(pk) }
    )
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
