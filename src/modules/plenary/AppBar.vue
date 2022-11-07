<template>
  <v-app-bar app flat color="app-bar">
    <router-link :to="agendaItemPath" :title="t('home.home')" class="mr-4">
      <img :src="require('@/assets/voteit-logo.svg')" alt="VoteIT" />
    </router-link>
    <v-app-bar-title class="text-truncate">
      <router-link v-if="agendaItem" :to="agendaItemPath" class="text-white text-decoration-none">
        {{ agendaItem.title }}
      </router-link>
    </v-app-bar-title>
    <div class="flex-shrink-0 d-flex">
      <DropdownMenu position="bottom" icon="mdi-star" :items="pollMenu" />
      <DropdownMenu position="bottom" :icon="stateFilter.length ? 'mdi-filter-menu' : 'mdi-filter-off'">
        <template v-slot:top>
          <v-item-group multiple v-model="stateFilter">
            <v-item v-for="{ state, count } in filterStates" :key="state.state" :value="state.state" v-slot="{ isSelected, toggle }">
              <v-list-item
                @click="toggle()"
                :prepend-icon="state.icon"
                :active="isSelected"
                :title="t(`workflowState.${state.state}`)"
                :subtitle="t('proposal.proposalCount', { count }, count)"
              />
            </v-item>
          </v-item-group>
        </template>
      </DropdownMenu>
      <template v-if="agendaItem">
        <v-btn variant="text" :disabled="!previousAgendaItem" :to="previousAgendaItem ? `/p/${meetingId}/${previousAgendaItem.pk}` : '/'" icon="mdi-chevron-left" />
        <v-btn variant="text" :disabled="!nextAgendaItem" :to="nextAgendaItem ? `/p/${meetingId}/${nextAgendaItem.pk}` : '/'" icon="mdi-chevron-right" />
      </template>
      <v-app-bar-nav-icon icon="mdi-format-list-bulleted" @click.stop="toggleNavDrawerEvent.emit()" />
    </div>
  </v-app-bar>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { openModalEvent, toggleNavDrawerEvent } from '@/utils/events'
import { MenuItem, ThemeColor } from '@/utils/types'
import { WorkflowState } from '@/contentTypes/types'

import { proposalStates } from '../proposals/workflowStates'
import useAgenda from '../agendas/useAgenda'
import useAgendaItem from '../agendas/useAgendaItem'
import useMeeting from '../meetings/useMeeting'
import useProposals from '../proposals/useProposals'
import { ProposalState } from '../proposals/types'
import { pollType } from '../polls/contentTypes'
import usePolls from '../polls/usePolls'
import { PollState } from '../polls/types'
import { Poll, PollMethodSettings, PollStartData } from '../polls/methods/types'

import usePlenary from './usePlenary'
import PollModal from './PollModal.vue'
import { QuickStartMethod } from './types'
import { PollPlugin } from '../polls/registry'

const { getState } = pollType.useWorkflows()

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const { meetingId, meetingPath } = useMeeting()
    const { agendaId, previousAgendaItem, nextAgendaItem } = useAgenda(meetingId)
    const { agendaItem, agendaItemPath, nextPollTitle } = useAgendaItem(agendaId)
    const { stateFilter, selectedProposals, selectedProposalIds } = usePlenary()
    const { getAgendaProposals } = useProposals()
    const { getAiPolls, getPollMethod } = usePolls()

    const filterMenuOpen = ref(false)
    function getStateProposalCount (state: ProposalState) {
      return getAgendaProposals(agendaId.value, p => p.state === state).length
    }
    const filterStates = computed(() => {
      return proposalStates.map(state => ({
        state,
        count: getStateProposalCount(state.state)
      }))
    })

    function pollStateToMenu (state: PollState): MenuItem[] {
      const wfState = getState(state) as WorkflowState
      return getAiPolls(agendaId.value, state)
        .map(poll => ({
          icon: wfState.icon,
          title: poll.title,
          subtitle: t(`poll.method.${poll.method_name}`),
          onClick: async () => openModalEvent.emit({
            title: poll.title,
            component: PollModal,
            data: poll
          })
        }))
    }

    const protectedProposalStates = computed(() => {
      return selectedProposals.value
        .map(p => p.state)
        .filter(s => s !== ProposalState.Published)
    })

    const working = ref(false)
    async function createPoll (method: Poll['method_name'], settings: PollMethodSettings | null) {
      working.value = true
      const pollData: PollStartData = {
        agenda_item: agendaId.value,
        meeting: meetingId.value,
        title: nextPollTitle.value as string,
        proposals: [...selectedProposalIds],
        method_name: method,
        start: true,
        settings: settings
      }
      if (protectedProposalStates.value.length) {
        const states = [...new Set(protectedProposalStates.value)].map(s => t(`workflowState.${s}`).toLowerCase()).join(', ')
        const title = t('plenary.confirmStartProtectedStates', { states }, protectedProposalStates.value.length)
        if (!await dialogQuery({ title, theme: ThemeColor.Warning })) return
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
          ...getPollMethod('combined_simple') as PollPlugin,
          settings: null,
          title: t('poll.method.combined_simple')
        },
        {
          ...getPollMethod('majority') as PollPlugin,
          settings: null,
          title: t('poll.method.majority')
        },
        {
          ...getPollMethod('schulze') as PollPlugin,
          proposalsMin: 3,
          settings: null,
          title: t('poll.method.schulze')
        },
        {
          ...getPollMethod('schulze') as PollPlugin,
          settings: { deny_proposal: true },
          title: t('poll.method.schulzeAddDeny')
        }
      ]
      return quickStartMethods.map(({ id, proposalsMax, proposalsMin, settings, title }) => {
        const proposalsExact = proposalsMin === proposalsMax
        const proposalCount = selectedProposals.value.length
        const disabled = !(proposalCount >= proposalsMin && (!proposalsMax || proposalCount <= proposalsMax))
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
      })
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

    return {
      t,
      agendaItem,
      agendaItemPath,
      filterMenuOpen,
      previousAgendaItem,
      meetingId,
      meetingPath,
      nextAgendaItem,
      pollMenu,
      selectedProposals,
      stateFilter,
      toggleNavDrawerEvent,
      filterStates,
      getStateProposalCount
    }
  }
})
</script>
