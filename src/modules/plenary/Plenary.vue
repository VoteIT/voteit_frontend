<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { openModalEvent } from '@/utils/events'
import { MenuItem, ThemeColor } from '@/utils/types'
import { RoleContextKey } from '@/injectionKeys'
import DropdownMenu from '@/components/DropdownMenu.vue'
import useChannel from '@/composables/useChannel'
import { LastReadKey } from '@/composables/useUnread'

import useAgenda from '../agendas/useAgenda'
import useAgendaItem from '../agendas/useAgendaItem'
import useMeeting from '../meetings/useMeeting'
import useMeetingChannel from '../meetings/useMeetingChannel'
import useMeetingTitle from '../meetings/useMeetingTitle'
import { pollType } from '../polls/contentTypes'
import { Poll, PollState } from '../polls/types'
import { PollMethodSettings, PollStartData } from '../polls/methods/types'
import { PollPlugin, pollPlugins } from '../polls/registry'
import usePolls from '../polls/usePolls'
import { proposalStates } from '../proposals/workflowStates'
import { ProposalState } from '../proposals/types'
import useProposals from '../proposals/useProposals'
import { proposalType } from '../proposals/contentTypes'
import BroadcastMenu from '../rooms/BroadcastMenu.vue'
import useRoom from '../rooms/useRoom'
import SpeakerHandling from '../speakerLists/SpeakerHandling.vue'

import AppBar from './AppBar.vue'
import AgendaNavigation from './AgendaNavigation.vue'
import DecisionsTab from './DecisionsTab.vue'
import PollModal from './PollModal.vue'
import { QuickStartMethod } from './types'
import usePlenary from './usePlenary'

const { t } = useI18n()

provide(RoleContextKey, 'meeting')
provide(LastReadKey, ref(new Date()))

const { isModerator, meetingId } = useMeeting()
const { agendaId } = useAgenda(meetingId)
const { speakerSystem } = useRoom()
const { getState } = pollType.useWorkflows()

const { nextPollTitle } = useAgendaItem(agendaId)
const {
  currentTab,
  stateFilter,
  selectedProposals,
  selectedProposalIds,
  tabs
} = usePlenary(meetingId, agendaId)
const { getAgendaProposals } = useProposals()
const { getAiPolls, getPollMethod } = usePolls()
const { getState: getProposalState } = proposalType.useWorkflows()

useMeetingChannel()
useChannel('agenda_item', agendaId)
useMeetingTitle(t('plenary.view'))

function getStateProposalCount(state: ProposalState) {
  return getAgendaProposals(agendaId.value, (p) => p.state === state).length
}

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

function pollStateToMenu(state: PollState): MenuItem[] {
  const wfState = getState(state)
  if (!wfState) throw new Error(`Unknown poll state '${state}'`)

  return getAiPolls(agendaId.value, state).map((poll) => ({
    icon: wfState.icon,
    title: poll.title,
    subtitle: pollPlugins.getName(poll.method_name, t),
    onClick: async () =>
      openModalEvent.emit({
        title: poll.title,
        component: PollModal,
        data: poll
      })
  }))
}

/**
 * Selected proposals that are in a protected state (not published)
 * If user tries to start a poll with any of these, have them confirm that it's ok
 */
const protectedProposalStates = computed(() => {
  return selectedProposals.value
    .map((p) => p.state)
    .filter((s) => s !== ProposalState.Published)
})

const working = ref(false)
async function createPoll(
  method: Poll['method_name'],
  settings: PollMethodSettings | null
) {
  working.value = true
  const pollData: Omit<PollStartData, 'p_ord' | 'withheld_result'> = {
    agenda_item: agendaId.value,
    meeting: meetingId.value,
    title: nextPollTitle.value as string,
    proposals: [...selectedProposalIds],
    method_name: method,
    start: true,
    settings
  }
  if (protectedProposalStates.value.length) {
    const states = [...new Set(protectedProposalStates.value)]
      .map((s) => getProposalState(s)!.getName(t).toLowerCase())
      .join(', ')
    const title = t(
      'plenary.confirmStartProtectedStates',
      { states },
      protectedProposalStates.value.length
    )
    if (!(await dialogQuery({ title, theme: ThemeColor.Warning }))) return
  }
  try {
    const { data } = await pollType.api.add(pollData as Partial<Poll>)
    openModalEvent.emit({
      title: data.title,
      component: PollModal,
      data
    })
  } catch {}
  working.value = false
}

const pollMethodMenu = computed<MenuItem[]>(() => {
  const quickStartMethods: QuickStartMethod[] = [
    {
      ...(getPollMethod('combined_simple') as PollPlugin),
      settings: null,
      title: t('poll.method.combined_simple')
    },
    {
      ...(getPollMethod('majority') as PollPlugin),
      settings: null,
      title: t('poll.method.majority')
    },
    {
      ...(getPollMethod('schulze') as PollPlugin),
      proposalsMin: 3,
      settings: null,
      title: t('poll.method.schulze')
    },
    {
      ...(getPollMethod('schulze') as PollPlugin),
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
        icon: 'mdi-vote',
        subtitle,
        title,
        onClick: () => createPoll(id as Poll['method_name'], settings)
      }
    }
  )
})

const pollMenu = computed<MenuItem[]>(() => {
  return [
    { subheader: t('plenary.startPoll') },
    ...pollMethodMenu.value,
    '---',
    { subheader: t('plenary.ongoingPolls') },
    ...pollStateToMenu(PollState.Ongoing),
    { subheader: t('plenary.finishedPolls') },
    ...pollStateToMenu(PollState.Finished)
  ]
})

const ongoingPollCount = computed(
  () => getAiPolls(agendaId.value, PollState.Ongoing).length
)
</script>

<template>
  <AppBar>
    <template #default v-if="isModerator">
      <v-tabs v-model="currentTab" :items="tabs" />
      <v-spacer />
      <template v-if="currentTab === 'decisions'">
        <v-badge
          :model-value="!!ongoingPollCount"
          :content="ongoingPollCount"
          :max="9"
          offset-x="6"
          offset-y="6"
          color="background"
        >
          <DropdownMenu position="bottom" icon="mdi-star" :items="pollMenu" />
        </v-badge>
        <v-menu location="bottom right">
          <template #activator="{ props }">
            <v-btn
              :icon="stateFilter.length ? 'mdi-filter-menu' : 'mdi-filter-off'"
              v-bind="props"
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
                  :subtitle="t('proposal.proposalCount', { count }, count)"
                />
              </v-item>
            </v-item-group>
          </v-list>
        </v-menu>
      </template>
    </template>
  </AppBar>
  <AgendaNavigation />
  <v-app-bar v-if="isModerator" bg-color="secondary" location="bottom">
    <BroadcastMenu />
  </v-app-bar>
  <v-main class="ma-6">
    <template v-if="currentTab === 'discussion'">
      <SpeakerHandling v-if="speakerSystem" :system-id="speakerSystem.pk" />
      <p v-else>
        <em>
          {{ t('plenary.noSpeakerSystem') }}
        </em>
      </p>
    </template>
    <DecisionsTab v-if="currentTab === 'decisions'" />
  </v-main>
</template>
