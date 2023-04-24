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
        <template #actions>
          <div class="text-right">
            <v-btn-group class="mr-2">
              <v-btn
                v-for="s in getProposalStates(p.state)" :key="s.state"
                :color="p.state === s.state ? s.color : 'background'"
                @click="makeTransition(p, s)"
                :loading="p.state !== s.state && transitioning.has(p.pk)"
              >
                <v-icon :icon="s.icon" />
              </v-btn>
            </v-btn-group>
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

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { flatten } from 'lodash'

import useChannel from '@/composables/useChannel'
import { LastReadKey } from '@/composables/useUnread'
import { WorkflowState } from '@/contentTypes/types'
import useAgenda from '../agendas/useAgenda'
import useAgendaItem from '../agendas/useAgendaItem'
import useProposals from '../proposals/useProposals'
import type { Proposal } from '../proposals/types'
import { ProposalState } from '../proposals/types'
import { proposalType } from '../proposals/contentTypes'
import useTextDocuments from '../proposals/useTextDocuments'
import { proposalStates } from '../proposals/workflowStates'
import useMeeting from '../meetings/useMeeting'
import useMeetingChannel from '../meetings/useMeetingChannel'
import { tagClickEvent } from '../meetings/useTags'

import usePlenary from './usePlenary'

const AVAILABLE_STATES = [ProposalState.Published, ProposalState.Approved, ProposalState.Denied]

const { anyProposal, getAgendaProposals } = useProposals()
const { filterProposalStates, selectedProposalIds, selectedProposals, selectProposal, selectTag, deselectProposal, clearSelected } = usePlenary()

provide('context', 'meeting')
const { t } = useI18n()
const { meetingId } = useMeeting()
const { agendaId } = useAgenda(meetingId)
const { agendaItem } = useAgendaItem(agendaId)
const { aiProposalTexts } = useTextDocuments(agendaId)

useMeetingChannel()
useChannel('agenda_item', agendaId)
provide(LastReadKey, ref(new Date()))

watch(agendaItem, clearSelected)

/**
 * Get list of state transitions that should be visible in state selection.
 * (Published, approved, denied, <other current state>)
 */
function getProposalStates (state: ProposalState) {
  return proposalStates.filter(s => AVAILABLE_STATES.includes(s.state) || state === s.state)
}

const pool = computed(() => getAgendaProposals(
  agendaId.value,
  p => filterProposalStates(p) && !selectedProposalIds.includes(p.pk)
))
const hasProposals = computed(() => anyProposal(p => p.agenda_item === agendaId.value))

function tagInPool (tag: string) {
  return pool.value.some(({ tags }) => tags.includes(tag))
}

const textProposalTags = computed(() => flatten(aiProposalTexts.value.map(doc => doc.paragraphs.map(p => p.tag))))
// eslint-disable-next-line vue/return-in-computed-property
const nextTextProposalTag = computed(() => {
  return textProposalTags.value.find(tagInPool)
})

const transitioning = reactive(new Set<number>())
async function makeTransition (p: Pick<Proposal, 'state' | 'pk'>, state: WorkflowState) {
  if (!state.transition) throw new Error(`Proposal state ${state.state} has no registered transition`)
  if (state.state === p.state) return // No need to change state then is there?
  transitioning.add(p.pk)
  try {
    await proposalType.api.transition(p.pk, state.transition)
  } catch {}
  transitioning.delete(p.pk)
}
onMounted(() => {
  tagClickEvent.on(selectTag)
  clearSelected()
})
onBeforeUnmount(() => {
  tagClickEvent.off(selectTag)
})
</script>
