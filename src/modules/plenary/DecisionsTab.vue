<script setup lang="ts">
import { map, range } from 'itertools'
import { flatten, sortBy } from 'lodash'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onKeyStroke, useElementBounding } from '@vueuse/core'

import Tag from '@/components/Tag.vue'
import { WorkflowState } from '@/contentTypes/types'
import useAgenda from '../agendas/useAgenda'
import useMeeting from '../meetings/useMeeting'
import useTags from '../meetings/useTags'
import type { Proposal } from '../proposals/types'
import { ProposalState } from '../proposals/types'
import { proposalType } from '../proposals/contentTypes'
import useProposals from '../proposals/useProposals'
import useTextDocuments from '../proposals/useTextDocuments'
import { proposalStates } from '../proposals/workflowStates'
import ButtonPlugins from '../proposals/ButtonPlugins.vue'
import useRoom from '../rooms/useRoom'

import usePlenary, { isSelectedProposal } from './usePlenary'
import AgendaInfoAlert from './AgendaInfoAlert.vue'
import { AgendaState } from '../agendas/types'

const AVAILABLE_STATES = [
  ProposalState.Published,
  ProposalState.Approved,
  ProposalState.Denied
] as Readonly<ProposalState[]>

const { meetingId } = useMeeting()
const { agendaId, agendaItem } = useAgenda(meetingId)
const { aiProposalTexts } = useTextDocuments(agendaId)
const {
  highlighted,
  highlightedProposals,
  isBroadcasting,
  meetingRoom,
  setHighlightedProposals
} = useRoom()

const {
  selectedProposalIds,
  selectedProposals,
  deselectProposal,
  filterProposalStates,
  selectProposal,
  selectProposalIds
} = usePlenary(meetingId, agendaId)

const { t } = useI18n()
const { getAgendaProposals } = useProposals()

const canChangeProposalState = computed(
  () =>
    !!agendaItem.value &&
    [AgendaState.Upcoming, AgendaState.Ongoing].includes(agendaItem.value.state)
)

/**
 * User is broadcasting and current Agenda Item is being broadcasted
 */
const isBroadcastingAI = computed(
  () =>
    isBroadcasting.value && meetingRoom.value?.agenda_item === agendaId.value
)

/**
 * If broadcasting, send selected proposals to server.
 * TODO: Handle errors by rechecking broadcasting status.
 */
// function setBroadcastProposals() {
//   if (!isBroadcastingAI.value) return
//   setHighlightedProposals([...selectedProposalIds.value])
// }

function select(proposal: Proposal) {
  if (isBroadcastingAI.value)
    setHighlightedProposals([...selectedProposalIds.value, proposal.pk])
  else selectProposal(proposal.pk)
}

function deselect(proposal: Proposal) {
  if (isBroadcastingAI.value)
    setHighlightedProposals(
      selectedProposalIds.value.filter((pk) => proposal.pk !== pk)
    )
  else deselectProposal(proposal.pk)
}

function selectTag(tag: string) {
  const proposals = sortBy(
    getAgendaProposals(
      agendaId.value,
      (p) => filterProposalStates(p) && p.tags.includes(tag)
    ),
    'created'
  ).map((p) => p.pk)
  if (isBroadcastingAI.value) setHighlightedProposals(proposals)
  else selectProposalIds(proposals)
}

const aiHighlighted = computed(() =>
  highlightedProposals.value
    .filter((p) => p.agenda_item === agendaId.value)
    .map((p) => p.pk)
)

// watch(selectedProposalIds, setBroadcastProposals)
// If current Agenda Item is broadcasting, select highlighted proposals from that broadcast.
// Otherwise clear selected proposals.
watch(
  agendaId,
  () => selectProposalIds(isBroadcastingAI.value ? highlighted.value : []),
  { immediate: true }
)
// When we know we're broadcasting current AI and highlighted changes or is set,
// select room highlighted
watch(
  () => isBroadcastingAI.value && aiHighlighted.value,
  (value) => value && selectProposalIds(value),
  { immediate: true }
)

/**
 * Get list of state transitions that should be visible in state selection.
 * (Published, approved, denied, <other current state>)
 */
function getProposalStates(state: ProposalState) {
  return proposalStates.filter(
    (s) => AVAILABLE_STATES.includes(s.state) || state === s.state
  )
}

const pool = computed(() =>
  getAgendaProposals(
    agendaId.value,
    (p) => filterProposalStates(p) && !isSelectedProposal(p)
  )
)
const transitioning = reactive(new Set<number>())
async function makeTransition(
  p: Pick<Proposal, 'state' | 'pk'>,
  state: WorkflowState
) {
  if (!state.transition)
    throw new Error(
      `Proposal state ${state.state} has no registered transition`
    )
  if (state.state === p.state) return // No need to change state then, is there?
  transitioning.add(p.pk)
  try {
    await proposalType.api.transition(p.pk, state.transition)
  } catch {}
  transitioning.delete(p.pk)
}

function tagInPool(tag: string) {
  return pool.value.some(({ tags }) => tags.includes(tag))
}

const textProposalTags = computed(() =>
  flatten(aiProposalTexts.value.map((doc) => doc.paragraphs.map((p) => p.tag)))
)
const nextTextProposalTag = computed(() =>
  textProposalTags.value.find(tagInPool)
)

useTags(undefined, selectTag)

// 1-9 selects or deselects (w altKey) proposals in order
onKeyStroke(map(range(1, 10), String), (e) => {
  e.preventDefault()
  const num = Number(e.key) - 1
  const proposal = e.altKey
    ? selectedProposals.value.at(num)
    : pool.value.at(num)
  if (!proposal) return
  if (e.altKey) deselect(proposal)
  else select(proposal)
})

// Esc to deselect all proposals
onKeyStroke('Escape', () => selectProposalIds([]))
// 'n' to select next proposal text tag
onKeyStroke(
  'n',
  () => nextTextProposalTag.value && selectTag(nextTextProposalTag.value)
)

// Handle height of agenda info alert
const agendaInfoEl = ref<HTMLDivElement | undefined>()
const { height: aiHeight } = useElementBounding(agendaInfoEl)
const proposalsStyle = computed(() => {
  return {
    '--aiheight': aiHeight.value ? `${aiHeight.value + 24}px` : '0px'
  }
})
</script>

<template>
  <div ref="agendaInfoEl">
    <AgendaInfoAlert class="mb-6" />
  </div>
  <v-row v-if="!selectedProposals.length && !pool.length">
    <v-col
      md="8"
      offset-md="2"
      lg="4"
      offset-lg="4"
      class="text-center text-secondary mt-12"
    >
      <h2 class="text-h4 mb-6">
        {{ t('plenary.noProposalsInFilter') }}
      </h2>
      <p>
        {{ t('plenary.hintModifyFilter') }}
      </p>
    </v-col>
  </v-row>
  <v-row v-else class="proposals" :style="proposalsStyle">
    <v-col cols="7" md="8" lg="9">
      <Proposal
        v-for="p in selectedProposals"
        :key="p.pk"
        readOnly
        :p="p"
        class="mb-4"
      >
        <template #actions>
          <div class="text-right">
            <v-btn-group class="mr-2">
              <v-btn
                v-for="s in getProposalStates(p.state)"
                :key="s.state"
                :color="p.state === s.state ? s.color : 'secondary'"
                :disabled="!canChangeProposalState"
                :loading="p.state !== s.state && transitioning.has(p.pk)"
                :variant="p.state === s.state ? 'flat' : 'tonal'"
                @click="makeTransition(p, s)"
              >
                <v-icon
                  :icon="s.icon"
                  size="large"
                  :color="p.state === s.state ? undefined : s.color"
                />
              </v-btn>
            </v-btn-group>
            <v-btn
              icon="mdi-chevron-right"
              variant="text"
              @click="deselect(p)"
            />
          </div>
        </template>
        <template #bottom>
          <ButtonPlugins mode="presentation" :proposal="p" class="mt-2" />
        </template>
      </Proposal>
      <div
        v-if="!selectedProposals.length"
        class="text-h4 text-center text-secondary mt-12"
      >
        <template v-if="nextTextProposalTag">
          <p class="mb-1">
            {{ t('plenary.nextParagraph') }}
          </p>
          <Tag
            v-if="nextTextProposalTag"
            :name="nextTextProposalTag"
            style="transform: scale(1.4)"
          />
        </template>
        <template v-else>
          {{ t('plenary.selectProposals') }}
          <v-icon icon="mdi-chevron-right" />
        </template>
      </div>
    </v-col>
    <v-col cols="5" md="4" lg="3">
      <div class="mb-6 d-flex" v-for="p in pool" :key="p.pk">
        <v-btn
          size="small"
          icon="mdi-chevron-left"
          variant="text"
          @click="select(p)"
        />
        <Proposal readOnly :p="p" class="flex-grow-1" />
      </div>
    </v-col>
  </v-row>
</template>

<style lang="sass">
.proposals
  height: calc(100vh - var(--v-layout-top) - var(--v-layout-bottom) - var(--aiheight) - 12px) !important
  overflow: hidden !important
  margin-bottom: -24px !important
  > div
    overflow-y: auto
    height: 100%
</style>
