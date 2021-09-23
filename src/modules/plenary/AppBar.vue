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
      <Menu :icon="stateFilter.length ? 'mdi-filter-menu' : 'mdi-filter-off'">
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

import { toggleNavDrawerEvent } from '@/utils'
import workflowStates, { ProposalState } from '@/contentTypes/proposal/workflowStates'

import useAgenda from '@/modules/agendas/useAgenda'
import useAgendaItem from '@/modules/agendas/useAgendaItem'
import useMeeting from '@/modules/meetings/useMeeting'

import usePlenary from './usePlenary'
import useProposals from '@/modules/proposals/useProposals'

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const { previousAgendaItem, nextAgendaItem } = useAgenda()
    const { agendaId, agendaItem, agendaItemPath } = useAgendaItem()
    const { meetingId, meetingPath } = useMeeting()
    const { stateFilter } = usePlenary()
    const { getAgendaProposals } = useProposals()

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

    return {
      t,
      agendaItem,
      agendaItemPath,
      filterMenuOpen,
      previousAgendaItem,
      meetingId,
      meetingPath,
      nextAgendaItem,
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
