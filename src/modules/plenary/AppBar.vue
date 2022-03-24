<template>
  <v-app-bar app flat>
    <v-app-bar-title>
      <router-link to="/" :title="t('home.home')" class="mr-4">
        <img :src="require('@/assets/voteit-logo.svg').default" alt="VoteIT" />
      </router-link>
    </v-app-bar-title>
    <v-app-bar-title class="text-truncate">
      <router-link v-if="agendaItem" :to="agendaItemPath">
        {{ agendaItem.title }}
      </router-link>
    </v-app-bar-title>
    <v-spacer/>
    <div class="flex-shrink-0">
      <Menu position="bottom" icon="mdi-star" :items="pollMenu" />
      <Menu position="bottom" :icon="stateFilter.length ? 'mdi-filter-menu' : 'mdi-filter-off'">
        <template v-slot:top>
          <v-item-group multiple v-model="stateFilter">
            <v-item v-for="{ state, count } in filterStates" :key="state.state" :value="state.state" v-slot="{ isSelected, toggle }">
              <v-list-item @click="toggle()" :prepend-icon="state.icon" :active="isSelected">
                <div>
                  <v-list-item-title>
                    {{ t(`workflowState.${state.state}`) }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ t('proposal.proposalCount', { count }, count) }}
                  </v-list-item-subtitle>
                </div>
              </v-list-item>
            </v-item>
          </v-item-group>
        </template>
      </Menu>
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
import { Poll, PollMethod, PollMethodName, PollMethodSettings, PollStartData } from '../polls/methods/types'

import usePlenary from './usePlenary'
import PollModal from './PollModal.vue'
import { QuickStartMethod } from './types'

const { getState } = pollType.useWorkflows()

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const { previousAgendaItem, nextAgendaItem } = useAgenda()
    const { agendaId, agendaItem, agendaItemPath, nextPollTitle } = useAgendaItem()
    const { meetingId, meetingPath } = useMeeting()
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
    async function createPoll (method: PollMethod, settings: PollMethodSettings | null) {
      working.value = true
      const pollData: PollStartData = {
        agenda_item: agendaId.value,
        meeting: meetingId.value,
        title: nextPollTitle.value as string,
        proposals: [...selectedProposalIds],
        method_name: method.name,
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
          method: getPollMethod(PollMethodName.CombinedSimple),
          settings: null,
          proposalsMin: 1,
          title: t('poll.method.combined_simple')
        },
        {
          method: getPollMethod(PollMethodName.Majority),
          settings: null,
          proposalsMin: 2,
          proposalsExact: 2,
          title: t('poll.method.majority')
        },
        {
          method: getPollMethod(PollMethodName.Schulze),
          settings: null,
          proposalsMin: 3, // This here is the reason we need to replicate this from pollMethods
          title: t('poll.method.schulze')
        },
        {
          method: getPollMethod(PollMethodName.Schulze),
          settings: { deny_proposal: true },
          proposalsMin: 2,
          title: t('poll.method.schulzeAddDeny')
        }
      ]
      return quickStartMethods.map(({ method, settings, title, ...opts }) => {
        let disabled, subtitle
        if (opts.proposalsExact) {
          disabled = selectedProposals.value.length !== opts.proposalsExact
          if (disabled) subtitle = t('plenary.selectExactProposals', opts.proposalsExact)
        } else {
          disabled = opts.proposalsMin > selectedProposals.value.length
          if (disabled) subtitle = t('plenary.selectMinProposals', opts.proposalsMin)
        }
        return {
          disabled,
          icon: 'mdi-vote',
          subtitle,
          title,
          onClick: () => createPoll(method, settings)
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

<style lang="sass" scoped>
a,
button
  color: rgb(var(--v-theme-on-app-bar))
  text-decoration: none
</style>
