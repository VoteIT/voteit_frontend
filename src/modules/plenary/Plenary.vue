<template>
  <v-row v-if="!selectedProposals.length && !pool.length">
    <v-col md="8" offset-md="2" lg="4" offset-lg="4" class="text-center text-secondary mt-12">
      <h2 class="text-h4 mb-6">{{ t('plenary.noProposalsInFilter') }}</h2>
      <v-alert v-if="hasProposals" type="info" :text="t('plenary.hintModifyFilter')" />
    </v-col>
  </v-row>
  <v-row v-else>
    <v-col cols="7" md="8" lg="9">
      <Widget v-for="p in selectedProposals" :key="p.pk">
        <div class="text-right">
          <span class="btn-group mr-2">
            <v-btn v-for="s in getProposalStates(p)" :key="s.name" :color="p.state === s.state ? s.color : 'background'"
                   @click="makeTransition(p, s)">
              <v-icon :icon="s.icon" />
            </v-btn>
          </span>
          <v-btn icon="mdi-chevron-right" variant="text" @click="deselectProposal(p)" />
        </div>
        <Proposal readOnly :p="p" />
      </Widget>
      <div v-if="!selectedProposals.length" class="text-h4 text-center text-secondary mt-12">
        {{ t('plenary.selectProposals') }} <v-icon icon="mdi-chevron-right" />
      </div>
    </v-col>
    <v-col cols="5" md="4" lg="3">
      <div class="mb-6 d-flex" v-for="p in pool" :key="p.pk">
        <v-btn size="small" icon="mdi-chevron-left" variant="text" @click="selectProposal(p)" />
        <Proposal readOnly :p="p" />
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import ProposalVue from '@/modules/proposals/Proposal.vue'
import useProposals from '@/modules/proposals/useProposals'
import { Proposal } from '@/modules/proposals/types'
import { LastReadKey } from '@/composables/useUnread'
import useMeetingChannel from '@/modules/meetings/useMeetingChannel'
import proposalType from '@/contentTypes/proposal'
import { WorkflowState } from '@/contentTypes/types'
import proposalStates, { ProposalState } from '@/contentTypes/proposal/workflowStates'
import useAgendaItem from '@/modules/agendas/useAgendaItem'

import usePlenary from './usePlenary'
import { tagClickEvent } from '../meetings/useTags'

const AVAILABLE_STATES = [ProposalState.Published, ProposalState.Approved, ProposalState.Denied]

export default defineComponent({
  components: {
    Proposal: ProposalVue
  },
  setup () {
    const { t } = useI18n()
    const { agendaId, agendaItem } = useAgendaItem()
    const { getAgendaProposals } = useProposals()
    const proposalApi = proposalType.getContentApi()
    const { filterProposalStates, selectedProposalIds, selectedProposals, selectProposal, selectTag, deselectProposal, clearSelected } = usePlenary()

    useMeetingChannel(true)
    provide(LastReadKey, ref(new Date()))

    watch(agendaItem, clearSelected)
    function getProposalStates (p: Proposal) {
      return proposalStates.filter(s => AVAILABLE_STATES.includes(s.state) || p.state === s.state)
    }

    const pool = computed(() => getAgendaProposals(
      agendaId.value,
      p => filterProposalStates(p) && !selectedProposalIds.includes(p.pk)
    ))
    const hasProposals = computed(() => !!getAgendaProposals(agendaId.value).length)

    async function makeTransition (p: Proposal, state: WorkflowState) {
      if (!state.transition) throw new Error(`Proposal state ${state.state} has no registered transition`)
      if (state.state === p.state) return // No need to change state then is there?
      await proposalApi.transition(p.pk, state.transition)
    }
    onMounted(() => {
      tagClickEvent.on(selectTag)
    })
    onBeforeUnmount(() => {
      tagClickEvent.off(selectTag)
    })

    return {
      t,
      agendaItem,
      hasProposals,
      pool,
      proposalStates,
      selectedProposals,
      deselectProposal,
      getProposalStates,
      makeTransition,
      selectProposal
    }
  }
})
</script>
