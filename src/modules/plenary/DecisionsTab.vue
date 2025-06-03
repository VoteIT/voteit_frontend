<script setup lang="ts">
import { enumerate, map, range } from 'itertools'
import { flatten, isEqual, sortBy } from 'lodash'
import {
  ComponentPublicInstance,
  computed,
  provide,
  reactive,
  ref,
  watch
} from 'vue'
import { useI18n } from 'vue-i18n'
import { onKeyStroke, useElementBounding, useTextSelection } from '@vueuse/core'

import { socket } from '@/utils/Socket'
import { navigationEventAllowed } from '@/utils/keyNavigation'
import Tag from '@/components/Tag.vue'
import useErrorHandler from '@/composables/useErrorHandler'
import { ExtractTransition, WorkflowState } from '@/contentTypes/types'
import useAgenda from '../agendas/useAgenda'
import { AgendaState } from '../agendas/types'
import { TagClickHandlerKey } from '../meetings/useTags'
import useMeetingId from '../meetings/useMeetingId'
import type { Proposal } from '../proposals/types'
import { ProposalState } from '../proposals/types'
import { proposalType } from '../proposals/contentTypes'
import useProposals from '../proposals/useProposals'
import useTextDocuments from '../proposals/useTextDocuments'
import { proposalStates } from '../proposals/workflowStates'
import ButtonPlugins from '../proposals/ButtonPlugins.vue'
import ProposalSheet from '../proposals/ProposalSheet.vue'
import useRoom from '../rooms/useRoom'
import { ProposalHighlight } from '../rooms/types'

import usePlenary, { isProposalInPool } from './usePlenary'
import AgendaInfoAlert from './AgendaInfoAlert.vue'
import { plenarySuggestions } from './registry'

const AVAILABLE_STATES = [
  ProposalState.Published,
  ProposalState.Approved,
  ProposalState.Denied
] as Readonly<ProposalState[]>

const meetingId = useMeetingId()
const { agendaId, agendaItem } = useAgenda(meetingId)
const { aiProposalTexts } = useTextDocuments(agendaId)
const {
  highlighted,
  isBroadcasting,
  meetingRoom,
  roomId,
  setHighlightedProposals
} = useRoom()

const {
  filteredProposals,
  selectedProposalIds,
  selectedProposals,
  deselectProposal,
  filterProposalStates,
  selectProposal,
  selectProposalIds
} = usePlenary(agendaId)

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
  if (!isBroadcastingAI.value) return selectProposal(proposal.pk)
  try {
    await setHighlightedProposals([...selectedProposalIds.value, proposal.pk])
    selectProposal(proposal.pk)
  } catch (e) {
    handleRestError(e, 'highlighted')
  }
}

async function deselect(proposal: Proposal) {
  if (!isBroadcastingAI.value) return deselectProposal(proposal.pk)
  try {
    await setHighlightedProposals(
      selectedProposalIds.value.filter((pk) => proposal.pk !== pk)
    )
    deselectProposal(proposal.pk)
  } catch (e) {
    handleRestError(e, 'highlighted')
  }
}

async function replaceSelection(proposals: number[]) {
  if (!isBroadcastingAI.value) return selectProposalIds(proposals)
  try {
    await setHighlightedProposals(proposals)
    selectProposalIds(proposals)
  } catch (e) {
    handleRestError(e, 'highlighted')
  }
}

function selectTag(tag: string) {
  replaceSelection(
    sortBy(
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

const suggestions = computed(() => [
  ...plenarySuggestions.iterPlugins(t, filteredProposals.value)
])

const nextTextProposalTag = computed(() => {
  const tag = textProposalTags.value.find(tagInPool)
  if (!tag) return
  return [tag, proposalTagCount.value.get(tag) || 0] as const
})

provide(TagClickHandlerKey, selectTag)

// 1-9 selects or deselects (w altKey) proposals in order
onKeyStroke(
  (e) =>
    map(range(1, 10), String).includes(e.key) &&
    navigationEventAllowed(e, ['altKey']),
  (e) => {
    e.preventDefault()
    const num = Number(e.key) - 1
    const proposal = e.altKey
      ? selectedProposals.value.at(num)
      : pool.value.at(num)
    if (!proposal) return
    if (e.altKey) deselect(proposal)
    else select(proposal)
  }
)

// Esc to deselect all proposals
onKeyStroke(
  (e) => e.key == 'Escape' && navigationEventAllowed(e),
  () => replaceSelection([])
)
// 'n' to select next proposal text tag
onKeyStroke(
  (e) => e.key === 'n' && navigationEventAllowed(e),
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

const proposalComponents = ref<ComponentPublicInstance[]>()
const { ranges } = useTextSelection()
function findProposalEl(range: Range) {
  if (!proposalComponents.value) return
  for (const [i, { $el }] of enumerate(proposalComponents.value)) {
    const elem = ($el as Element).querySelector(
      '.proposal-text-paragraph,.ql-editor'
    )
    if (elem && range.intersectsNode(elem))
      return { i, elem: elem as HTMLElement }
  }
}

let delayTimeout: NodeJS.Timeout
function delayed(cb: () => void) {
  clearTimeout(delayTimeout)
  delayTimeout = setTimeout(cb, 125)
}

let lastSelection: ProposalHighlight | undefined

/**
 * Get proposal and selection if there is selected proposal text.
 */
function getProposalSelection() {
  const range = ranges.value.at(0)
  if (!range?.toString().length) return // No selection
  const prop = findProposalEl(range)
  if (!prop) return // Selection not in a proposal
  const startRange = document.createRange()
  startRange.setStart(prop.elem, 0)
  startRange.setEnd(range.startContainer, range.startOffset)
  const start = startRange.toString().length
  const selection = {
    room: roomId.value,
    proposal: selectedProposalIds.value[prop.i],
    start,
    end: Math.min(prop.elem.innerText.length, start + range.toString().length)
  }
  return selection
}

const proposalClicked = ref<number>()
function setHighlight() {
  if (!isBroadcastingAI.value) return // Only when broadcasting...
  const selection = getProposalSelection() ?? {
    room: roomId.value,
    proposal: proposalClicked.value
  }
  if (isEqual(selection, lastSelection)) return
  lastSelection = selection
  socket.send('room.mark_text', selection)
}

watch(
  () => ranges.value.at(0),
  () => delayed(setHighlight)
)
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
        {{ $t('plenary.noProposalsInFilter') }}
      </h2>
      <p>
        {{ $t('plenary.hintModifyFilter') }}
      </p>
    </v-col>
  </v-row>
  <v-row v-else class="proposals" :style="proposalsStyle">
    <v-col cols="7" md="8" lg="9" @click="proposalClicked = undefined">
      <ProposalSheet
        v-for="p in selectedProposals"
        :key="p.pk"
        class="mb-4"
        :proposal="p"
        :selectInRoom="meetingRoom?.pk"
        ref="proposalComponents"
        @click.stop="proposalClicked = p.pk"
      >
        <template #actions>
          <div class="text-right" @click.stop>
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
          <div class="d-flex flex-wrap ga-1 mt-2">
            <ButtonPlugins mode="presentation" :proposal="p" />
          </div>
        </template>
      </ProposalSheet>
      <div
        v-if="!selectedProposals.length"
        class="text-h4 text-center text-secondary mt-12"
      >
        <div
          class="my-12"
          v-for="plugin in suggestions"
          :key="plugin.title"
          :style="plugin.style"
        >
          <p class="mb-1">
            {{ plugin.title }}
          </p>
          <Tag
            v-if="plugin.v === 'tags'"
            v-for="{ tag, count } in plugin.tags"
            :key="tag"
            class="mx-5"
            :count="count"
            :name="tag"
            style="transform: scale(var(--tag-scale, 1.2))"
          />
          <component
            v-else
            :is="plugin.component"
            v-bind="plugin.props"
            @selected="replaceSelection"
          />
        </div>
        <template v-if="!suggestions.length">
          {{ $t('plenary.selectProposals') }}
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

<style scoped lang="sass">
.proposals
  height: calc(100vh - var(--v-layout-top) - var(--v-layout-bottom) - var(--aiheight) - 12px) !important
  overflow: hidden !important
  margin-bottom: -24px !important
  > div
    overflow-y: auto
    height: 100%
</style>
