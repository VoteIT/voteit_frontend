<script setup lang="ts">
import {
  ComponentPublicInstance,
  computed,
  onUnmounted,
  provide,
  ref,
  watch
} from 'vue'
import { useDisplay } from 'vuetify'
import { useElementSize, useStorage } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

import { openModalEvent } from '@/utils/events'
import { LastReadKey } from '@/composables/useUnread'
import DefaultDialog from '@/components/DefaultDialog.vue'

import useAgendaItem from '../agendas/useAgendaItem'
import useMeeting from '../meetings/useMeeting'
import useMeetingTitle from '../meetings/useMeetingTitle'
import { pollType } from '../polls/contentTypes'
import { Poll, PollState } from '../polls/types'
import { pollPlugins } from '../polls/registry'
import usePollStore from '../polls/usePollStore'
import { proposalType } from '../proposals/contentTypes'
import { ProposalState } from '../proposals/types'
import useProposalStore from '../proposals/useProposalStore'
import useRoom from '../rooms/useRoom'
import SpeakerHandling from '../speakerLists/SpeakerHandling.vue'
import useSpeakerSystem from '../speakerLists/useSpeakerSystem'

import AppBar from './AppBar.vue'
import AgendaNavigation from './AgendaNavigation.vue'
import BroadcastMenu from './BroadcastMenu.vue'
import DecisionsTab from './DecisionsTab.vue'
import { QuickStartMethod } from './types'
import usePlenary from './usePlenary'
import StartPollModal from './StartPollModal.vue'
import PollModal from './PollModal.vue'

const { t } = useI18n()

provide(LastReadKey, ref(new Date()))

const { isModerator } = useMeeting()
const { agendaId, meetingAndAiOngoing } = useAgendaItem()
const {
  hasSpeakerLists,
  isBroadcasting,
  meetingRoom,
  roomId,
  roomOpenPoll,
  handleBroadcast
} = useRoom()
const { systemActiveList } = useSpeakerSystem(roomId, agendaId)

const {
  currentTab,
  isBroadcastingAI,
  stateFilter,
  selectedProposals,
  getPlenaryRoute
} = usePlenary(agendaId)
const { countAiProposals } = useProposalStore()
const { getAiPolls, getPollMethod, getPollStatus } = usePollStore()

useMeetingTitle(t('plenary.view'))

function getStateProposalCount(state: ProposalState) {
  return countAiProposals(agendaId.value, (p) => p.state === state)
}

function getActiveAIRoute(agendaItem?: number | null) {
  if (agendaItem && agendaItem !== agendaId.value)
    return getPlenaryRoute({
      tab: currentTab.value,
      aid: agendaItem
    })
}

const toActiveSpeakerList = computed(() =>
  getActiveAIRoute(systemActiveList.value?.agenda_item)
)
const toActiveProposals = computed(() => {
  if (!isBroadcastingAI.value)
    return getActiveAIRoute(meetingRoom.value?.agenda_item)
})

const filterStates = computed(() => {
  return proposalType.sm.getStateList().map((state) => {
    const count = getStateProposalCount(state.state)
    return {
      state,
      count,
      title: state.translate(t, count)
    }
  })
})

function pollStateToItems(state: PollState) {
  const wfState = pollType.sm.getState(state)
  if (!wfState) throw new Error(`Unknown poll state '${state}'`)

  return getAiPolls(agendaId.value, state).map((poll) => {
    const active = state === PollState.Ongoing
    return {
      active,
      poll,
      pollStatus: active ? getPollStatus(poll.pk) : undefined,
      prependIcon: wfState.icon,
      subtitle: pollPlugins.getName(poll.method_name, t),
      title: poll.title
    }
  })
}

/**
 * Preexisting polls to display in poll menu.
 * Display order important.
 */
function* iterMenuPollStates() {
  for (const { state, translate } of pollType.sm.getPriorityStates()) {
    if (state === PollState.Canceled) continue // No need to display actively canceled polls
    const polls = pollStateToItems(state)
    if (polls.length)
      yield {
        polls,
        title: `${translate(t, polls.length)} ${t(
          'poll.poll',
          polls.length
        ).toLocaleLowerCase()}`
      }
  }
}
const menuPollStates = computed(() => [...iterMenuPollStates()])

function openPoll(poll: Poll) {
  if (isBroadcasting.value) handleBroadcast({ poll: poll.pk })
  openModalEvent.emit({
    component: PollModal,
    data: poll,
    title: poll.title
  })
}

const pollMethodMenu = computed(() => {
  const quickStartMethods: QuickStartMethod[] = [
    {
      ...getPollMethod('combined_simple')!,
      settings: null,
      title: t('poll.method.combined_simple')
    },
    {
      ...getPollMethod('majority')!,
      settings: null,
      title: t('poll.method.majority')
    },
    {
      ...getPollMethod('schulze')!,
      proposalsMin: 3,
      settings: null,
      title: t('poll.method.schulze')
    },
    {
      ...getPollMethod('schulze')!,
      settings: { deny_proposal: true },
      title: t('poll.method.schulzeAddDeny')
    }
  ]
  return quickStartMethods.map(
    ({ id, proposalsMax, proposalsMin, settings, title }) => {
      const proposalsExact = proposalsMin === proposalsMax
      const proposalCount = selectedProposals.value.length
      const proposalCountValid =
        proposalCount >= proposalsMin &&
        (!proposalsMax || proposalCount <= proposalsMax)
      const disabled =
        !isModerator.value || !meetingAndAiOngoing.value || !proposalCountValid
      let subtitle: string | undefined
      if (!isModerator.value) subtitle = t('plenary.onlyManageSpeakers')
      else if (!meetingAndAiOngoing.value)
        subtitle = t('poll.meetingAndAgendaMustBeOngoing')
      else if (!proposalCountValid)
        subtitle = proposalsExact
          ? t('plenary.selectExactProposals', proposalsMin)
          : t('plenary.selectMinProposals', proposalsMin)
      return {
        disabled,
        prependIcon: 'mdi-vote',
        id,
        settings,
        subtitle,
        title
      }
    }
  )
})

const ongoingPollCount = computed(
  () => getAiPolls(agendaId.value, PollState.Ongoing).length
)

function getSplitSubtitle() {
  if (!isModerator.value) return t('plenary.onlyManageSpeakers')
  if (!hasSpeakerLists.value) return t('plenary.speakerListsNotConfigured')
  return t('plenary.manageSpeakersAndDecisions')
}

const viewOptions = computed(() => [
  {
    disabled: !hasSpeakerLists.value,
    icon: 'mdi-lectern',
    id: 'discussion',
    subtitle: hasSpeakerLists.value
      ? t('plenary.manageSpeakers')
      : t('plenary.speakerListsNotConfigured'),
    title: t('plenary.speakerListsTitle')
  },
  {
    disabled: !isModerator.value,
    icon: 'mdi-gavel',
    id: 'decisions',
    subtitle: isModerator.value
      ? t('plenary.viewProposalsAndStartPolls')
      : t('plenary.onlyManageSpeakers'),
    title: t('plenary.proposalsAndDecisions')
  },
  {
    disabled: !isModerator.value || !hasSpeakerLists.value,
    icon: 'mdi-view-split-vertical',
    id: 'split',
    subtitle: getSplitSubtitle(),
    title: t('plenary.splitViewTitle')
  }
])
const currentView = computed(
  () => viewOptions.value.find(({ id }) => currentTab.value === id)!
)

const minLeft = 480
const minRight = 980
const resizerWidth = 24
const splitContainer = ref<ComponentPublicInstance | null>(null)
const leftWidth = useStorage<number | null>('plenary:leftWidth', null)
const isDragging = ref(false)

// Below the lg breakpoint there's no room for both sides at all
const { lgAndUp: splitPossible } = useDisplay()
const showSplit = computed(
  () => currentTab.value === 'split' && splitPossible.value
)

const { width: containerWidth } = useElementSize(
  computed(() => {
    const el = splitContainer.value?.$el
    return el instanceof Element ? (el as HTMLElement) : null
  })
)

// Resizing only makes sense when both sides fit at their minimum widths
const canResize = computed(
  () => containerWidth.value >= minLeft + minRight + resizerWidth
)

function clampLeft(width: number) {
  const max = containerWidth.value - minRight - resizerWidth
  return Math.max(minLeft, Math.min(max, width))
}

// Stored width is the user's preference, clamped here rather than overwritten
const effectiveLeftWidth = computed(() => {
  if (!canResize.value) return minLeft
  return clampLeft(leftWidth.value ?? Math.floor(containerWidth.value / 3))
})

let cleanupResize: (() => void) | null = null

function startResize(e: MouseEvent) {
  if (e.button !== 0) return
  e.preventDefault()
  const startX = e.clientX
  const startWidth = effectiveLeftWidth.value

  const onMouseMove = (ev: MouseEvent) => {
    leftWidth.value = clampLeft(startWidth + (ev.clientX - startX))
  }

  isDragging.value = true

  const onMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    cleanupResize = null
  }

  cleanupResize = onMouseUp
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// Abort an ongoing drag if the window shrinks below resizable width
watch(canResize, (value) => {
  if (!value) cleanupResize?.()
})

onUnmounted(() => cleanupResize?.())
</script>

<template>
  <AppBar>
    <template #default>
      <v-menu>
        <template #activator="{ props }">
          <v-btn
            append-icon="mdi-chevron-down"
            :prepend-icon="currentView.icon"
            :text="currentView.title"
            v-bind="props"
          />
        </template>
        <v-list>
          <v-list-item
            v-for="{ id, icon, ...props } in viewOptions"
            :key="id"
            :prepend-icon="icon"
            v-bind="props"
            :to="{ params: { tab: id } }"
          />
        </v-list>
      </v-menu>
      <v-spacer />
      <template v-if="currentTab === 'discussion'">
        <v-fade-transition>
          <v-btn
            v-if="toActiveSpeakerList"
            :text="$t('plenary.toActiveSpeakerList')"
            :to="toActiveSpeakerList"
            variant="tonal"
          />
        </v-fade-transition>
      </template>
      <template v-else>
        <v-fade-transition>
          <v-btn
            v-if="toActiveProposals"
            :text="$t('plenary.toActiveAgendaItem')"
            :to="toActiveProposals"
            variant="tonal"
          />
        </v-fade-transition>
        <v-badge
          :model-value="!!ongoingPollCount"
          :content="ongoingPollCount"
          :max="9"
          offset-x="3"
          offset-y="3"
          color="background"
        >
          <v-menu location="bottom right">
            <template #activator="{ props }">
              <v-btn
                append-icon="mdi-chevron-down"
                v-bind="props"
                :text="$t('poll.poll', 2)"
              />
            </template>
            <v-list>
              <v-list-subheader :title="$t('plenary.startPoll')" />
              <DefaultDialog
                v-for="{ id, settings, ...item } in pollMethodMenu"
                :key="id"
                :title="roomOpenPoll?.title ?? $t('plenary.startPoll')"
                @close="handleBroadcast({ poll: null })"
              >
                <template #activator="{ props }">
                  <v-list-item v-bind="{ ...item, ...props }" />
                </template>
                <template #default="{ close }">
                  <StartPollModal
                    :method-name="id"
                    :proposals="selectedProposals"
                    :settings="settings"
                    @cancel="close"
                  />
                </template>
              </DefaultDialog>
              <v-divider v-if="menuPollStates.length" class="my-3" />
              <template v-for="{ title, polls } in menuPollStates" :key="title">
                <v-list-subheader :title="title" />
                <template
                  v-for="{ poll, pollStatus, ...props } in polls"
                  :key="poll.pk"
                >
                  <v-list-item v-bind="props" @click="openPoll(poll)" />
                  <v-progress-linear
                    v-if="pollStatus"
                    :model-value="pollStatus.voted"
                    :max="pollStatus.total"
                    color="success-lighten-2"
                  />
                </template>
              </template>
            </v-list>
          </v-menu>
        </v-badge>
        <v-menu location="bottom right">
          <template #activator="{ props }">
            <v-btn
              append-icon="mdi-chevron-down"
              v-bind="props"
              :text="$t('filter')"
            />
          </template>
          <v-list>
            <v-item-group multiple v-model="stateFilter">
              <v-item
                v-for="{ count, state, title } in filterStates"
                :key="state.state"
                :value="state.state"
                v-slot="{ isSelected, toggle }"
              >
                <v-list-item
                  @click.stop="toggle"
                  :prepend-icon="state.icon"
                  :active="isSelected"
                  :title="title"
                  :subtitle="$t('proposal.proposalCount', { count }, count)"
                />
              </v-item>
            </v-item-group>
          </v-list>
        </v-menu>
      </template>
      <BroadcastMenu />
    </template>
  </AppBar>
  <AgendaNavigation />
  <v-main
    v-if="currentTab === 'split' && !splitPossible"
    class="d-flex align-center justify-center pa-6"
  >
    <v-card
      color="info"
      max-width="560"
      prepend-icon="mdi-view-split-vertical"
      :text="$t('plenary.splitViewTooNarrowDescription')"
      :title="$t('plenary.splitViewTooNarrowTitle')"
    >
      <template #actions>
        <v-btn
          v-for="{ id, icon, title, disabled } in viewOptions.filter(
            ({ id }) => id !== 'split'
          )"
          :key="id"
          :disabled="disabled"
          :prepend-icon="icon"
          :text="title"
          :to="{ params: { tab: id } }"
        />
      </template>
    </v-card>
  </v-main>
  <v-main v-else class="split-container d-flex" ref="splitContainer">
    <SpeakerHandling
      v-if="currentTab !== 'decisions'"
      class="pa-6 split-left flex-shrink-0 overflow-auto"
      :class="{ 'flex-grow-1': !showSplit }"
      :key-bindings="currentTab === 'discussion' ? 'all' : 'startStop'"
      :room="roomId"
      :style="showSplit ? { width: effectiveLeftWidth + 'px' } : {}"
    />
    <div
      v-if="showSplit && canResize"
      class="resizer"
      :class="{ active: isDragging }"
      @mousedown="startResize"
    >
      <v-icon class="resizer-icon">mdi-arrow-split-vertical</v-icon>
    </div>
    <v-divider v-else-if="showSplit" vertical />
    <DecisionsTab
      v-if="currentTab !== 'discussion'"
      class="split-right flex-grow-1"
    />
  </v-main>
</template>

<style lang="sass" scoped>
.split-container
  height: calc(100vh - var(--v-layout-top) - var(--v-layout-bottom))
  overflow: hidden

.split-left
  min-width: 480px

.resizer
  flex-shrink: 0
  width: 24px
  cursor: col-resize
  background: transparent
  display: flex
  align-items: center
  justify-content: center
  transition: background 0.15s
  background: rgba(var(--v-theme-secondary), 0.05)

  &-icon
    opacity: .1
    transition: opacity 0.15s
    pointer-events: none

  &:hover,
  &:active,
  &.active
    background: rgba(var(--v-theme-secondary), 0.25)

    .resizer-icon
      opacity: .5

.split-right
  min-width: 640px
</style>
