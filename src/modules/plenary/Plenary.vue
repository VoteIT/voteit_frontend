<template>
  <v-row v-if="!selectedProposals.length && !pool.length">
    <v-col md="8" offset-md="2" lg="4" offset-lg="4" class="text-center text-secondary mt-12">
      <h2 class="text-h4 mb-6">{{ t('plenary.noProposalsInFilter') }}</h2>
      <v-alert v-if="hasProposals" type="info" :text="t('plenary.hintModifyFilter')" />
    </v-col>
  </v-row>
  <v-row v-else>
    <v-col cols="7" md="8" lg="9">
      <Proposal v-for="p in selectedProposals" :key="p.pk" readOnly :p="p" class="mb-4">
        <template #top>
          <div class="text-right">
            <span class="btn-group mr-2">
              <v-btn v-for="s in getProposalStates(p)" :key="s.name" :color="p.state === s.state ? s.color : 'background'"
                    @click="makeTransition(p, s)">
                <v-icon :icon="s.icon" />
              </v-btn>
            </span>
            <v-btn icon="mdi-chevron-right" variant="text" @click="deselectProposal(p)" />
          </div>
        </template>
      </Proposal>
      <div v-if="!selectedProposals.length" class="text-h4 text-center text-secondary mt-12">
        <template v-if="nextTextProposalTag">
           <p class="mb-1">
            {{ t('plenary.nextParagraph') }}
          </p>
          <Tag v-if="nextTextProposalTag" :name="nextTextProposalTag" style="transform: scale(1.4);" />
        </template>
        <template v-else>
          {{ t('plenary.selectProposals') }} <v-icon icon="mdi-chevron-right" />
        </template>
      </div>
    </v-col>
    <v-col cols="5" md="4" lg="3">
      <div class="mb-6 d-flex" v-for="p in pool" :key="p.pk">
        <v-btn size="small" icon="mdi-chevron-left" variant="text" @click="selectProposal(p)" />
        <Proposal readOnly :p="p" class="flex-grow-1" />
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { flatten } from 'lodash'

import { LastReadKey } from '@/composables/useUnread'
import { WorkflowState } from '@/contentTypes/types'
import useAgendaItem from '../agendas/useAgendaItem'
import ProposalVue from '../proposals/Proposal.vue'
import useProposals from '../proposals/useProposals'
import { Proposal, ProposalState } from '../proposals/types'
import { proposalType } from '../proposals/contentTypes'
import useTextDocuments from '../proposals/useTextDocuments'
import { proposalStates } from '../proposals/workflowStates'
import useMeetingChannel from '../meetings/useMeetingChannel'
import { tagClickEvent } from '../meetings/useTags'

import usePlenary from './usePlenary'

const AVAILABLE_STATES = [ProposalState.Published, ProposalState.Approved, ProposalState.Denied]

const { getAgendaProposals } = useProposals()
const { filterProposalStates, selectedProposalIds, selectedProposals, selectProposal, selectTag, deselectProposal, clearSelected } = usePlenary()

export default defineComponent({
  components: {
    Proposal: ProposalVue
  },
  setup () {
    const { t } = useI18n()
    const { agendaId, agendaItem } = useAgendaItem()
    const { aiProposalTexts } = useTextDocuments(agendaId)

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

    const textProposalTags = computed(() => flatten(aiProposalTexts.value.map(doc => doc.paragraphs.map(p => p.tag))))
    // eslint-disable-next-line vue/return-in-computed-property
    const nextTextProposalTag = computed(() => {
      for (const tag of textProposalTags.value) {
        if (pool.value.some(prop => prop.tags.includes(tag))) return tag
      }
    })

    async function makeTransition (p: Proposal, state: WorkflowState) {
      if (!state.transition) throw new Error(`Proposal state ${state.state} has no registered transition`)
      if (state.state === p.state) return // No need to change state then is there?
      await proposalType.api.transition(p.pk, state.transition)
    }
    onMounted(() => {
      tagClickEvent.on(selectTag)
      clearSelected()
    })
    onBeforeUnmount(() => {
      tagClickEvent.off(selectTag)
    })

    return {
      t,
      agendaItem,
      hasProposals,
      nextTextProposalTag,
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
