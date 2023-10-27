<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onKeyStroke } from '@vueuse/core'

import { toggleNavDrawerEvent } from '@/utils/events'
import WorkflowState from '@/components/WorkflowState.vue'

import { agendaItemType } from '../agendas/contentTypes'
import useAgenda from '../agendas/useAgenda'
import useAgendaItem from '../agendas/useAgendaItem'
import useMeeting from '../meetings/useMeeting'
import useRoom from '../rooms/useRoom'

const router = useRouter()
const { meetingId, meetingRoute } = useMeeting()
const { agendaId, previousAgendaItem, nextAgendaItem } = useAgenda(meetingId)
const { agendaItem, agendaItemRoute, canChangeAgendaItem } =
  useAgendaItem(agendaId)
const { roomId } = useRoom()

function getPath(aid: number, room?: number) {
  return {
    name: 'Plenary',
    params: {
      id: meetingId.value,
      aid,
      roomId: room || roomId.value
    }
  }
}

/* Agenda navigation */
function navigateAgendaItem(aid?: number) {
  if (!aid) return
  router.push(getPath(aid))
}
onKeyStroke('ArrowLeft', () => navigateAgendaItem(previousAgendaItem.value?.pk))
onKeyStroke('ArrowRight', () => navigateAgendaItem(nextAgendaItem.value?.pk))
</script>

<template>
  <v-app-bar flat color="app-bar">
    <router-link :to="meetingRoute">
      <img src="@/assets/voteit-logo.svg" alt="VoteIT" id="navbar-logo" />
    </router-link>
    <v-app-bar-title class="text-truncate">
      <router-link
        v-if="agendaItem && agendaItemRoute"
        :to="agendaItemRoute"
        class="text-white text-decoration-none"
      >
        {{ agendaItem.title }}
      </router-link>
    </v-app-bar-title>
    <div class="flex-shrink-0 d-flex align-center">
      <WorkflowState
        v-if="agendaItem"
        :admin="canChangeAgendaItem"
        color="background"
        :content-type="agendaItemType"
        :object="agendaItem"
      />
      <div class="pa-3"></div>
      <template v-if="agendaItem">
        <v-btn
          variant="text"
          :disabled="!previousAgendaItem"
          :to="previousAgendaItem ? getPath(previousAgendaItem.pk) : '/'"
          icon="mdi-chevron-left"
        />
        <v-btn
          variant="text"
          :disabled="!nextAgendaItem"
          :to="nextAgendaItem ? getPath(nextAgendaItem.pk) : '/'"
          icon="mdi-chevron-right"
        />
      </template>
      <v-app-bar-nav-icon
        icon="mdi-format-list-bulleted"
        @click.stop="toggleNavDrawerEvent.emit()"
      />
    </div>
    <template #extension>
      <slot></slot>
    </template>
  </v-app-bar>
</template>
