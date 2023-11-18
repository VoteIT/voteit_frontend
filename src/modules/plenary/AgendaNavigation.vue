<template>
  <v-navigation-drawer v-model="isOpen" location="right" disable-resize-watcher>
    <template v-if="agendaTags.length">
      <div class="d-flex mb-1">
        <v-btn
          class="flex-grow-1"
          variant="text"
          size="small"
          :append-icon="filterMenuOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          @click="filterMenuOpen = !filterMenuOpen"
        >
          {{ t('filter') }}
        </v-btn>
        <v-btn
          variant="text"
          size="small"
          :disabled="!selectedAgendaTag"
          @click="selectedAgendaTag = undefined"
        >
          <v-icon icon="mdi-undo" />
        </v-btn>
      </div>
      <v-expand-transition>
        <v-chip-group
          column
          class="ml-8"
          v-model="selectedAgendaTag"
          :items="agendaTags"
          v-show="filterMenuOpen"
        >
          <v-chip
            v-for="tag in agendaTags"
            :key="tag"
            :value="tag"
            size="small"
          >
            {{ tag }}
          </v-chip>
        </v-chip-group>
      </v-expand-transition>
    </template>
    <v-list nav>
      <template
        v-for="{ state, items } in annotatedAgendaStates"
        :key="state.state"
      >
        <v-list-subheader v-if="items.length">
          {{ state.getName(t, items.length) }}
        </v-list-subheader>
        <v-list-item v-for="ai in items" :key="ai.pk" :to="getURL(ai)">
          <v-list-item-title>
            {{ ai.title }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{
              t(
                'proposal.proposalCountOfTotal',
                ai.proposals,
                ai.proposals.total
              )
            }}
          </v-list-item-subtitle>
        </v-list-item>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { toggleNavDrawerEvent } from '@/utils/events'

import useAgenda from '../agendas/useAgenda'
import { AgendaItem, AgendaState } from '../agendas/types'
import useMeeting from '../meetings/useMeeting'
import useProposals from '../proposals/useProposals'

import usePlenary from './usePlenary'
import { sortBy } from 'lodash'
import useAgendaTags from '../agendas/useAgendaTags'

const { t } = useI18n()
const { meetingId } = useMeeting()
const { agenda, agendaId, agendaStates } = useAgenda(meetingId)
const { agendaTags, selectedAgendaTag, aiMatchesTag } = useAgendaTags(agenda)
const { filterProposalStates } = usePlenary(meetingId, agendaId)
const { getAgendaProposals } = useProposals()
const isOpen = ref(false)

function toggle() {
  isOpen.value = !isOpen.value
}

function getURL(ai: AgendaItem) {
  return `/p/${meetingId.value}/${ai.pk}`
}

const AGENDA_STATE_ORDER = [
  AgendaState.Ongoing,
  AgendaState.Upcoming,
  AgendaState.Closed,
  AgendaState.Archived,
  AgendaState.Private
] as const
const filterMenuOpen = ref(false)

const annotatedAgendaStates = computed(() => {
  return sortBy(
    agendaStates.value.map(({ state, items }) => {
      return {
        state,
        items: items.filter(aiMatchesTag).map((ai) => ({
          ...ai,
          proposals: {
            filtered: getAgendaProposals(ai.pk, filterProposalStates).length,
            total: getAgendaProposals(ai.pk).length
          }
        }))
      }
    }),
    ({ state }) => AGENDA_STATE_ORDER.indexOf(state.state)
  )
})

onMounted(() => {
  toggleNavDrawerEvent.on(toggle)
})
onBeforeUnmount(() => {
  toggleNavDrawerEvent.off(toggle)
})
</script>
