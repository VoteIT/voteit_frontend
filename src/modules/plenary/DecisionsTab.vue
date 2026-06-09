<script setup lang="ts">
import { map, range, sorted } from 'itertools'
import { flatten } from 'lodash'
import {
  computed,
  provide,
  reactive,
  shallowRef,
  watch,
  watchEffect
} from 'vue'
import { useI18n } from 'vue-i18n'
import { onKeyStroke, useElementBounding } from '@vueuse/core'

import { socket } from '@/utils/Socket'
import { navigationEventAllowed } from '@/utils/keyNavigation'
import ChoiceDialog from '@/components/ChoiceDialog.vue'
import Tag from '@/components/Tag.vue'
import useErrorHandler from '@/composables/useErrorHandler'
import { AgendaState } from '../agendas/types'
import useAgendaItem from '../agendas/useAgendaItem'
import { TagClickHandlerKey } from '../meetings/useTags'
import type { Proposal } from '../proposals/types'
import { ProposalState } from '../proposals/types'
import { proposalType } from '../proposals/contentTypes'
import useProposalStore from '../proposals/useProposalStore'
import useTextDocuments from '../proposals/useTextDocuments'
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

const { agendaId, agendaItem } = useAgendaItem()
const { aiProposalTexts } = useTextDocuments(agendaId)
const { highlighted, isBroadcasting, meetingRoom, roomId, handleBroadcast } =
  useRoom()

const {
  broadcastFollowAgendaItem,
  filteredProposals,
  selectedProposalIds,
  selectedProposals,
  deselectProposal,
  filterProposalStates,
  selectProposal,
  selectProposalIds
} = usePlenary(agendaId)

const { t } = useI18n()
const { filterProposals } = useProposalStore()
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
    await handleBroadcast({
      highlighted: [...selectedProposalIds.value, proposal.pk]
    })
    selectProposal(proposal.pk)
  } catch (e) {
    handleRestError(e, 'highlighted')
  }
}

async function deselect(proposal: Proposal) {
  if (!isBroadcastingAI.value) return deselectProposal(proposal.pk)
  try {
    await handleBroadcast({
      highlighted: selectedProposalIds.value.filter((pk) => proposal.pk !== pk)
    })
    deselectProposal(proposal.pk)
  } catch (e) {
    handleRestError(e, 'highlighted')
  }
}

async function replaceSelection(proposals: number[]) {
  if (!isBroadcastingAI.value) return selectProposalIds(proposals)
  try {
    await handleBroadcast({ highlighted: proposals })
    selectProposalIds(proposals)
  } catch (e) {
    handleRestError(e, 'highlighted')
  }
}

function selectTag(tag: string) {
  replaceSelection(
    sorted(
      filterProposals(
        (p) =>
          p.agenda_item === agendaId.value &&
          filterProposalStates(p) &&
          p.tags.includes(tag)
      ),
      (p) => p.created
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
  return proposalType.sm.getStateList(
    (s) => AVAILABLE_STATES.includes(s.state) || state === s.state
  )
}

const pool = computed(() => filteredProposals.value.filter(isProposalInPool))
const transitioning = reactive(new Set<number>())
async function makeTransition(p: Proposal, state: Proposal['state']) {
  const event = proposalType.sm.getAvailableEvents(p, state).at(0)
  if (!event)
    throw new Error(`Proposal state ${state} has no registered transition`)
  transitioning.add(p.pk)
  try {
    await proposalType.events.make(p, event.id, t)
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
const agendaInfoEl = shallowRef<HTMLDivElement | undefined>()
const { height: aiHeight } = useElementBounding(agendaInfoEl)
const proposalsStyle = computed(() => {
  return {
    '--aiheight': aiHeight.value ? `${aiHeight.value + 24}px` : '0px'
  }
})

// Expected proposal selection
const proposalHighlight = shallowRef<Omit<ProposalHighlight, 'room'>>()

function setTextSelection(
  proposal: number,
  selection?: { start: number; end: number }
) {
  proposalHighlight.value = {
    proposal,
    ...selection
  }
}

function handleProposalClick(proposal?: number) {
  if (!isBroadcastingAI.value) return // Only when broadcasting...
  if (proposalHighlight.value?.proposal !== proposal)
    proposalHighlight.value = { proposal }
  socket.send('room.mark_text', {
    room: roomId.value,
    ...proposalHighlight.value
  })
}

/**
 * Make user choose whether to follow my Agenda Item of if that shoud be an active choice
 */
const followChoiceDialog = computed(
  () => isBroadcasting.value && broadcastFollowAgendaItem.value === undefined
)

const broadcastFollowOptions = [
  {
    color: 'success',
    icon: 'mdi-cast-connected',
    title: t('plenary.follow.automatic'),
    value: true
  },
  {
    color: 'primary',
    icon: 'mdi-gesture-tap-button',
    title: t('plenary.follow.manual'),
    value: false
  }
]

async function setFollowAI(value: boolean) {
  broadcastFollowAgendaItem.value = value
}

/**
 * If we should follow users broadcast, make sure we're broadcasting current one.
 */
watchEffect(() => {
  if (
    !isBroadcasting.value ||
    !broadcastFollowAgendaItem.value ||
    !agendaItem.value ||
    agendaItem.value.state === AgendaState.Private
  )
    return
  if (meetingRoom.value?.agenda_item !== agendaId.value)
    handleBroadcast({
      agenda_item: agendaId.value,
      highlighted: selectedProposalIds.value
    })
})
</script>

<template>
  <div>
    <ChoiceDialog
      :description="$t('plenary.follow.description')"
      :handler="setFollowAI"
      :options="broadcastFollowOptions"
      :title="$t('plenary.follow.title')"
      v-model="followChoiceDialog"
    />
    <div ref="agendaInfoEl">
      <AgendaInfoAlert class="ma-6 mb-0" />
    </div>
    <div
      v-if="!selectedProposals.length && !pool.length"
      class="text-center text-secondary pt-12 flex-grow-1"
    >
      <h2 class="text-h4 mb-6">
        {{ $t('plenary.noProposalsInFilter') }}
      </h2>
      <p>
        {{ $t('plenary.hintModifyFilter') }}
      </p>
    </div>
    <div
      v-else
      class="proposals d-flex overflow-hidden"
      :style="proposalsStyle"
    >
      <div
        class="flex-grow-1 overflow-y-auto d-flex flex-column ga-4 pa-6"
        @click="handleProposalClick()"
      >
        <ProposalSheet
          v-for="p in selectedProposals"
          :key="p.pk"
          :proposal="p"
          :selected="proposalHighlight?.proposal === p.pk"
          ref="proposalComponents"
          @click.stop="handleProposalClick(p.pk)"
          @update:selection="setTextSelection(p.pk, $event)"
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
                  @click="makeTransition(p, s.state)"
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
              <ButtonPlugins mode="presentation:personal" :proposal="p" />
            </div>
          </template>
        </ProposalSheet>
        <div
          v-if="!selectedProposals.length"
          class="text-h4 text-center text-secondary pa-6 pt-12"
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
            <template v-if="plugin.v === 'tags'">
              <Tag
                v-for="{ tag, count } in plugin.tags"
                :key="tag"
                class="mx-5"
                :count="count"
                :name="tag"
                style="transform: scale(var(--tag-scale, 1.2))"
              />
            </template>
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
      </div>
      <div
        class="proposal-pool d-flex flex-column ga-6 w-25 overflow-y-auto pa-6 pl-0"
      >
        <div class="d-flex" v-for="p in pool" :key="p.pk">
          <v-btn
            size="small"
            icon="mdi-chevron-left"
            variant="text"
            @click="select(p)"
          />
          <ProposalSheet :proposal="p" class="flex-grow-1" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="sass">
.proposals
  height: calc(100vh - var(--v-layout-top) - var(--v-layout-bottom) - var(--aiheight))

.proposal-pool
  min-width: 344px
</style>
