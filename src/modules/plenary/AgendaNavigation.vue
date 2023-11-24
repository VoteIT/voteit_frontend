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
        <v-list-item
          v-for="ai in items"
          :key="ai.pk"
          :to="getRoute(ai.pk)"
          :title="ai.title"
          :subtitle="
            t('proposal.proposalCountOfTotal', ai.proposals, ai.proposals.total)
          "
        >
          <template #append v-if="ai.symbols.length">
            <v-tooltip
              v-for="{ icon, text } in ai.symbols"
              :key="icon"
              :text="text"
            >
              <template #activator="{ props }">
                <v-icon :icon="icon" v-bind="props" />
              </template>
            </v-tooltip>
          </template>
        </v-list-item>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { sortBy } from 'lodash'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { toggleNavDrawerEvent } from '@/utils/events'

import useAgenda from '../agendas/useAgenda'
import { AgendaState } from '../agendas/types'
import useAgendaTags from '../agendas/useAgendaTags'
import useMeeting from '../meetings/useMeeting'
import { anyPoll } from '../polls/usePolls'
import { PollState } from '../polls/types'
import useProposals from '../proposals/useProposals'
import useRoom from '../rooms/useRoom'
import { anySpeakerList } from '../speakerLists/useSpeakerLists'

import usePlenary from './usePlenary'

const { t } = useI18n()
const { meetingId } = useMeeting()
const { agenda, agendaId, agendaStates } = useAgenda(meetingId)
const { agendaTags, selectedAgendaTag, aiMatchesTag } = useAgendaTags(agenda)
const { speakerSystem, meetingRoom, roomId } = useRoom()
const { currentTab, filterProposalStates, getPlenaryRoute } = usePlenary(
  meetingId,
  agendaId
)
const { getAgendaProposals } = useProposals()

const isOpen = ref(false)

function toggle() {
  isOpen.value = !isOpen.value
}

function getRoute(aid: number) {
  return getPlenaryRoute({
    roomId: roomId.value,
    aid,
    tab: currentTab.value
  })
}

const AGENDA_STATE_ORDER = [
  AgendaState.Ongoing,
  AgendaState.Upcoming,
  AgendaState.Closed,
  AgendaState.Archived,
  AgendaState.Private
] as const
const filterMenuOpen = ref(false)

function* getSymbols(ai: number) {
  if (
    meetingRoom.value?.send_proposals &&
    meetingRoom.value?.agenda_item === ai
  )
    yield { icon: 'mdi-broadcast', text: t('room.broadcast') }
  if (
    meetingRoom.value?.send_sls &&
    anySpeakerList(
      (list) =>
        list.agenda_item === ai && speakerSystem.value?.active_list === list.pk
    )
  )
    yield { icon: 'mdi-bullhorn', text: t('speaker.listActive') }
  if (anyPoll((p) => p.agenda_item === ai && p.state === PollState.Ongoing))
    yield { icon: 'mdi-star', text: t('plenary.ongoingPolls') }
}

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
          },
          symbols: [...getSymbols(ai.pk)]
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
