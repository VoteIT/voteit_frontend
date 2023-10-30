import { ComputedRef, computed, reactive, readonly, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import { ProposalState, Proposal } from '@/modules/proposals/types'
import useProposals from '@/modules/proposals/useProposals'
import useRoom from '../rooms/useRoom'

const { getProposal, forProposals } = useProposals()

const stateFilter = ref([ProposalState.Published])
const selectedProposalIds = reactive<number[]>([])

export default function usePlenary(
  meetingId: ComputedRef<number>,
  agendaItem: ComputedRef<number>
) {
  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const { roomId } = useRoom()

  const tabs = [
    {
      prependIcon: 'mdi-bullhorn',
      value: 'discussion',
      text: t('plenary.discussion')
    },
    {
      prependIcon: 'mdi-gavel',
      value: 'decisions',
      text: t('plenary.decisions')
    }
  ] as const
  type Tab = (typeof tabs)[number]['value']

  const currentTab = computed({
    get() {
      return route.params.tab as Tab
    },
    set(tab) {
      router.push(getPlenaryPath({ tab }))
    }
  })

  function getPlenaryPath(params: {
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

  function filterProposalStates(p: Proposal) {
    return !stateFilter.value.length || stateFilter.value.includes(p.state)
  }

  function selectProposal(p: Pick<Proposal, 'pk'>) {
    selectedProposalIds.push(p.pk)
  }
  function deselectProposal(p: Pick<Proposal, 'pk'>) {
    const index = selectedProposalIds.indexOf(p.pk)
    if (index !== -1) selectedProposalIds.splice(index, 1)
  }
  function clearSelected() {
    selectedProposalIds.length = 0
  }
  const selectedProposals = computed(() =>
    readonly(
      selectedProposalIds.map(getProposal).filter((p): p is Proposal => !!p)
    )
  )

  function selectTag(tagName: string) {
    selectedProposalIds.length = 0
    forProposals(
      (p) =>
        p.agenda_item === agendaItem.value &&
        filterProposalStates(p) &&
        p.tags.includes(tagName),
      ({ pk }) => {
        selectedProposalIds.push(pk)
      }
    )
  }

  return {
    currentTab,
    selectedProposalIds: readonly(selectedProposalIds),
    selectedProposals,
    stateFilter,
    tabs,
    clearSelected,
    deselectProposal,
    filterProposalStates,
    getPlenaryPath,
    selectProposal,
    selectTag
  }
}
