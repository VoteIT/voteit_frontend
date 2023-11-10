<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { onKeyStroke } from '@vueuse/core'

import { toggleNavDrawerEvent } from '@/utils/events'
import WorkflowState from '@/components/WorkflowState.vue'

import { agendaItemType } from '../agendas/contentTypes'
import useAgenda from '../agendas/useAgenda'
import useAgendaItem from '../agendas/useAgendaItem'
import useMeeting from '../meetings/useMeeting'
import useRoom from '../rooms/useRoom'
import usePlenary from './usePlenary'

const router = useRouter()
const { meetingId, meetingRoute } = useMeeting()
const { agendaId, previousAgendaItem, nextAgendaItem } = useAgenda(meetingId)
const { agendaItem, agendaItemRoute, canChangeAgendaItem } =
  useAgendaItem(agendaId)
const { meetingRoom } = useRoom()

const { getPlenaryPath } = usePlenary(meetingId, agendaId)

/* Agenda navigation */
function navigateAgendaItem(aid?: number) {
  if (!aid) return
  router.push(getPlenaryPath({ aid }))
}
onKeyStroke(
  'ArrowLeft',
  (event) => !event.altKey && navigateAgendaItem(previousAgendaItem.value?.pk)
)
onKeyStroke(
  'ArrowRight',
  (event) => !event.altKey && navigateAgendaItem(nextAgendaItem.value?.pk)
)

const breadcrumbs = computed(() => [
  { title: meetingRoom.value?.title ?? '-' },
  { title: agendaItem.value?.title ?? '-' }
])
</script>

<template>
  <v-app-bar flat color="app-bar">
    <router-link :to="agendaItemRoute ?? meetingRoute">
      <img src="@/assets/voteit-logo.svg" alt="VoteIT" id="navbar-logo" />
    </router-link>
    <v-app-bar-title class="text-truncate">
      <v-breadcrumbs :items="breadcrumbs" />
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
          :to="
            previousAgendaItem
              ? getPlenaryPath({ aid: previousAgendaItem.pk })
              : '/'
          "
          icon="mdi-chevron-left"
        />
        <v-btn
          variant="text"
          :disabled="!nextAgendaItem"
          :to="
            nextAgendaItem ? getPlenaryPath({ aid: nextAgendaItem.pk }) : '/'
          "
          icon="mdi-chevron-right"
        />
      </template>
      <v-app-bar-nav-icon
        icon="mdi-format-list-bulleted"
        @click.stop="toggleNavDrawerEvent.emit()"
      />
    </div>
    <template v-if="$slots.default" #extension>
      <slot></slot>
    </template>
  </v-app-bar>
</template>
