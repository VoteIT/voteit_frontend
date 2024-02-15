<script setup lang="ts">
import { filter, map, range } from 'itertools'
import { flatten, orderBy } from 'lodash'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onKeyStroke, useElementBounding } from '@vueuse/core'

import Tag from '@/components/Tag.vue'
import { ExtractTransition, WorkflowState } from '@/contentTypes/types'
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

import usePlenary, { isProposalInPool } from './usePlenary'
import AgendaInfoAlert from './AgendaInfoAlert.vue'
import { AgendaState } from '../agendas/types'
import ProposalSheet from '../proposals/ProposalSheet.vue'
import useErrorHandler from '@/composables/useErrorHandler'

const AVAILABLE_STATES = [
  ProposalState.Published,
  ProposalState.Approved,
  ProposalState.Denied
] as Readonly<ProposalState[]>

const { meetingId } = useMeeting()
const { agendaId, agendaItem } = useAgenda(meetingId)
const { aiProposalTexts } = useTextDocuments(agendaId)
const { highlighted, isBroadcasting, meetingRoom, setHighlightedProposals } =
  useRoom()

const {
  filteredProposals,
  selectedProposalIds,
  selectedProposals,
  deselectProposal,
  filterProposalStates,
  selectProposal,
  selectProposalIds
} = usePlenary(meetingId, agendaId)

const { t } = useI18n()
const { getAgendaProposals } = useProposals()
const { handleRestError } = useErrorHandler({ target: 'dialog' })

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

async function select(proposal: Proposal) {
  if (isBroadcastingAI.value) {
    try {
      await setHighlightedProposals([...selectedProposalIds.value, proposal.pk])
      selectProposal(proposal.pk)
    } catch (e) {
      handleRestError(e, 'highlighted')
    }
  } else selectProposal(proposal.pk)
}

async function deselect(proposal: Proposal) {
  if (isBroadcastingAI.value) {
    try {
      await setHighlightedProposals(
        selectedProposalIds.value.filter((pk) => proposal.pk !== pk)
      )
      deselectProposal(proposal.pk)
    } catch (e) {
      handleRestError(e, 'highlighted')
    }
  } else deselectProposal(proposal.pk)
}

async function replaceSelection(proposals: number[]) {
  if (isBroadcastingAI.value) {
    try {
      await setHighlightedProposals(proposals)
      selectProposalIds(proposals)
    } catch (e) {
      handleRestError(e, 'highlighted')
    }
  } else selectProposalIds(proposals)
}

function selectTag(tag: string) {
  replaceSelection(
    orderBy(
      getAgendaProposals(
        agendaId.value,
        (p) => filterProposalStates(p) && p.tags.includes(tag)
      ),
      'created'
    ).map((p) => p.pk)
  )
}

// If current Agenda Item is broadcasting, select highlighted proposals from that broadcast.
// Otherwise clear selected proposals.
// Do not trigger until room is loaded and highlighted is set.
watch(
  () => meetingRoom.value && highlighted.value && agendaId.value,
  (value) => {
    value && selectProposalIds(isBroadcastingAI.value ? highlighted.value! : [])
  },
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

const pool = computed(() => filteredProposals.value.filter(isProposalInPool))
const transitioning = reactive(new Set<number>())
async function makeTransition(
  p: Proposal,
  state: WorkflowState<ProposalState, ExtractTransition<typeof proposalStates>>
) {
  if (!state.transition)
    throw new Error(
      `Proposal state ${state.state} has no registered transition`
    )
  if (state.state === p.state) return // No need to change state then, is there?
  transitioning.add(p.pk)
  try {
    await proposalType.transitions.make(p, state.transition, t)
  } catch (e) {
    handleRestError(e, 'transition')
  }
  transitioning.delete(p.pk)
}

function tagInPool(tag: string) {
  return pool.value.some(({ tags }) => tags.includes(tag))
}

const textProposalTags = computed(() =>
  flatten(aiProposalTexts.value.map((doc) => doc.paragraphs.map((p) => p.tag)))
)

/**
 * Map tags -> number of proposals with tag in current filter
 */
const proposalTagCount = computed(() => {
  const counter = new Map<string, number>()
  for (const prop of filteredProposals.value) {
    for (const tag of prop.tags) counter.set(tag, (counter.get(tag) || 0) + 1)
  }
  return counter
})

const nextTextProposalTag = computed(() => {
  const tag = textProposalTags.value.find(tagInPool)
  if (!tag) return
  return [tag, proposalTagCount.value.get(tag) || 0] as const
})

const allProposalIds = computed(() =>
  filteredProposals.value.map((p) => p.prop_id)
)
/**
 * Tags that are not prop ids, and not next paragraph tag.
 * Ordered by tag name.
 */
const otherTags = computed(() =>
  orderBy(
    filter(
      proposalTagCount.value.entries(),
      ([tag]) =>
        !allProposalIds.value.includes(tag) &&
        tag !== nextTextProposalTag.value?.[0]
    ),
    ([tag]) => tag
  )
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
onKeyStroke('Escape', () => replaceSelection([]))
// 'n' to select next proposal text tag
onKeyStroke(
  'n',
  () => nextTextProposalTag.value && selectTag(nextTextProposalTag.value[0])
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
      <ProposalSheet
        v-for="p in selectedProposals"
        :key="p.pk"
        :proposal="p"
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
        <template #append>
          <ButtonPlugins mode="presentation" :proposal="p" class="mt-2" />
        </template>
      </ProposalSheet>
      <div
        v-if="!selectedProposals.length"
        class="text-h4 text-center text-secondary mt-12"
      >
        <template v-if="nextTextProposalTag || otherTags.length">
          <template v-if="nextTextProposalTag">
            <p class="mb-1">
              {{ t('plenary.nextParagraph') }}
            </p>
            <Tag
              :name="nextTextProposalTag[0]"
              :count="nextTextProposalTag[1]"
              style="transform: scale(1.4)"
            />
          </template>
          <template v-if="otherTags.length">
            <p class="mt-12 mb-1">
              {{ t('plenary.otherTags', otherTags.length) }}
            </p>
            <span v-for="[tag, count] in otherTags" :key="tag" class="mx-5">
              <Tag :name="tag" :count="count" style="transform: scale(1.2)" />
            </span>
          </template>
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
        <ProposalSheet :proposal="p" class="flex-grow-1" />
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
