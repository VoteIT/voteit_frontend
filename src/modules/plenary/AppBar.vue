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
                <v-list-item-content>
                  <v-list-item-title>
                    {{ t(`workflowState.${state.state}`) }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ t('proposal.proposalCount', { count }, count) }}
                  </v-list-item-subtitle>
                </v-list-item-content>
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

import { openModalEvent, toggleNavDrawerEvent } from '@/utils'
import workflowStates, { ProposalState } from '@/contentTypes/proposal/workflowStates'

import useAgenda from '@/modules/agendas/useAgenda'
import useAgendaItem from '@/modules/agendas/useAgendaItem'
import useMeeting from '@/modules/meetings/useMeeting'
import pollType from '@/contentTypes/poll'

import usePlenary from './usePlenary'
import useProposals from '@/modules/proposals/useProposals'
import { MenuItem } from '@/utils/types'
import usePolls from '../polls/usePolls'
import { PollState } from '../polls/types'
import PollModal from './PollModal.vue'
import { WorkflowState } from '@/contentTypes/types'

const { getState } = pollType.useWorkflows()

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const { previousAgendaItem, nextAgendaItem } = useAgenda()
    const { agendaId, agendaItem, agendaItemPath } = useAgendaItem()
    const { meetingId, meetingPath } = useMeeting()
    const { stateFilter, selectedProposals } = usePlenary()
    const { getAgendaProposals } = useProposals()
    const { getAiPolls, getPollMethods } = usePolls()

    const filterMenuOpen = ref(false)
    function getStateProposalCount (state: ProposalState) {
      return getAgendaProposals(agendaId.value, p => p.state === state).length
    }
    const filterStates = computed(() => {
      return workflowStates.map(state => ({
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

    const pollMethodMenu = computed<MenuItem[]>(() => {
      const pollMethods = getPollMethods(selectedProposals.value.length, true)
        .filter(method => method.quickStart)
      return pollMethods.map(method => {
        return {
          icon: 'mdi-vote',
          title: t(`poll.method.${method.name}`),
          subtitle: method.disabled ? t('plenary.selectMinProposals', { min: method.proposalsMin }, method.proposalsMin ?? 1) : undefined,
          onClick: async () => {},
          disabled: method.disabled
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
.v-app-bar
  overflow: visible
  color: rgb(var(--v-theme-on-app-bar))
a
  color: rgb(var(--v-theme-on-app-bar))
  text-decoration: none
</style>
