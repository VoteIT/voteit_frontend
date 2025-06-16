<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { openModalEvent } from '@/utils/events'
import { RoleContextKey } from '@/injectionKeys'
import useChannel from '@/composables/useChannel'
import { LastReadKey } from '@/composables/useUnread'
import useLoader from '@/composables/useLoader'
import DefaultDialog from '@/components/DefaultDialog.vue'

import useAgenda from '../agendas/useAgenda'
import useMeeting from '../meetings/useMeeting'
import useMeetingChannel from '../meetings/useMeetingChannel'
import useMeetingTitle from '../meetings/useMeetingTitle'
import { pollType } from '../polls/contentTypes'
import { Poll, PollState } from '../polls/types'
import { pollPlugins } from '../polls/registry'
import usePolls, { getPollStatus } from '../polls/usePolls'
import { proposalStates } from '../proposals/workflowStates'
import { ProposalState } from '../proposals/types'
import useProposals from '../proposals/useProposals'
import BroadcastMenu from '../rooms/BroadcastMenu.vue'
import useRoom from '../rooms/useRoom'
import SpeakerHandling from '../speakerLists/SpeakerHandling.vue'
import useSpeakerSystem from '../speakerLists/useSpeakerSystem'

import AppBar from './AppBar.vue'
import AgendaNavigation from './AgendaNavigation.vue'
import DecisionsTab from './DecisionsTab.vue'
import { QuickStartMethod } from './types'
import usePlenary from './usePlenary'
import StartPollModal from './StartPollModal.vue'
import PollModal from './PollModal.vue'

const { t } = useI18n()

provide(RoleContextKey, 'meeting')
provide(LastReadKey, ref(new Date()))

const tabs = computed(() => [
  {
    disabled: !hasSpeakerLists.value,
    prependIcon: 'mdi-bullhorn',
    value: 'discussion' as const,
    text: t('plenary.discussion')
  },
  {
    disabled: !isModerator.value,
    prependIcon: 'mdi-gavel',
    value: 'decisions' as const,
    text: t('plenary.decisions')
  }
])

const { isModerator, meetingId } = useMeeting()
const { agendaId } = useAgenda(meetingId)
const {
  hasSpeakerLists,
  isBroadcasting,
  meetingRoom,
  roomId,
  roomOpenPoll,
  speakerSystem,
  setPoll,
  setSlsBroadcast
} = useRoom()
const { getState, getPriorityStates } = pollType.useWorkflows()
const { systemActiveList } = useSpeakerSystem(roomId, agendaId)

const { currentTab, stateFilter, selectedProposals, getPlenaryRoute } =
  usePlenary(agendaId)
const { getAgendaProposals } = useProposals()
const { getAiPolls, getPollMethod } = usePolls()

useMeetingChannel()
useLoader('Plenary', useChannel('agenda_item', agendaId).promise)
useMeetingTitle(t('plenary.view'))

function getStateProposalCount(state: ProposalState) {
  return getAgendaProposals(agendaId.value, (p) => p.state === state).length
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
const toActiveProposals = computed(() =>
  getActiveAIRoute(meetingRoom.value?.agenda_item)
)

const filterStates = computed(() => {
  return proposalStates.map((state) => {
    const count = getStateProposalCount(state.state)
    return {
      state,
      count,
      title: state.getName(t, count)
    }
  })
})

function pollStateToItems(state: PollState) {
  const wfState = getState(state)
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
  for (const { state, getName } of getPriorityStates()) {
    if (state === PollState.Canceled) continue // No need to display actively canceled polls
    const polls = pollStateToItems(state)
    if (polls.length)
      yield {
        polls,
        title: `${getName(t, polls.length)} ${t(
          'poll.poll',
          polls.length
        ).toLocaleLowerCase()}`
      }
  }
}
const menuPollStates = computed(() => [...iterMenuPollStates()])

function openPoll(poll: Poll) {
  if (isBroadcasting.value) setPoll(poll.pk)
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
      const disabled = !(
        proposalCount >= proposalsMin &&
        (!proposalsMax || proposalCount <= proposalsMax)
      )
      const subtitle = disabled
        ? proposalsExact
          ? t('plenary.selectExactProposals', proposalsMin)
          : t('plenary.selectMinProposals', proposalsMin)
        : undefined
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
</script>

<template>
  <AppBar>
    <template #default>
      <v-tabs v-model="currentTab" :items="tabs" />
      <v-spacer />
      <template v-if="currentTab === 'decisions'">
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
                @close="setPoll(null)"
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
      <BroadcastMenu />
    </template>
  </AppBar>
  <AgendaNavigation />
  <v-main class="ma-6">
    <template v-if="currentTab === 'discussion'">
      <v-alert
        v-if="!meetingRoom?.send_sls"
        class="mb-6"
        :border="true"
        type="info"
        :title="$t('room.displaySpeakers')"
        :text="$t('room.displaySpeakersDescription')"
      >
        <template #append>
          <v-btn
            @click="setSlsBroadcast()"
            prepend-icon="mdi-bullhorn"
            :text="$t('room.displaySpeakers')"
          />
        </template>
      </v-alert>
      <SpeakerHandling :room="roomId" />
    </template>
    <DecisionsTab v-if="currentTab === 'decisions'" />
  </v-main>
</template>
