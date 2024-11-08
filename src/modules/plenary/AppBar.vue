<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { onKeyStroke } from '@vueuse/core'

import { toggleNavDrawerEvent } from '@/utils/events'
import { navigationEventAllowed } from '@/utils/keyNavigation'
import WorkflowState from '@/components/WorkflowState.vue'

import { agendaItemType } from '../agendas/contentTypes'
import useAgenda from '../agendas/useAgenda'
import useAgendaItem from '../agendas/useAgendaItem'
import useMeeting from '../meetings/useMeeting'
import useRoom from '../rooms/useRoom'
import usePlenary from './usePlenary'

const { t } = useI18n()
const router = useRouter()
const { meeting, meetingId, meetingRoute } = useMeeting()
const { agendaId, previousAgendaItem, nextAgendaItem } = useAgenda(meetingId)
const { agendaItem, canChangeAgendaItem } = useAgendaItem(agendaId)
const { meetingRoom } = useRoom()

const { getPlenaryRoute } = usePlenary(agendaId)

/* Agenda navigation */
function navigateAgendaItem(aid?: number) {
  if (!aid) return
  router.push(getPlenaryRoute({ aid }))
}

onKeyStroke(
  (e) => e.key === 'ArrowLeft' && navigationEventAllowed(e),
  () => navigateAgendaItem(previousAgendaItem.value?.pk)
)
onKeyStroke(
  (e) => e.key === 'ArrowRight' && navigationEventAllowed(e),
  () => navigateAgendaItem(nextAgendaItem.value?.pk)
)

const breadcrumbs = computed(() => [
  { title: meeting.value?.title ?? '', to: meetingRoute.value },
  { title: meetingRoom.value?.title ?? '-' },
  { title: agendaItem.value?.title ?? '-' }
])
</script>

<template>
  <v-app-bar flat color="app-bar">
    <router-link :to="meetingRoute">
      <img src="@/assets/voteit-logo.svg" alt="VoteIT" id="navbar-logo" />
    </router-link>
    <v-app-bar-title class="text-truncate">
      <small class="position-absolute">
        {{ t('plenary.view') }}
      </small>
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
              ? getPlenaryRoute({ aid: previousAgendaItem.pk })
              : '/'
          "
          icon="mdi-chevron-left"
        />
        <v-btn
          variant="text"
          :disabled="!nextAgendaItem"
          :to="
            nextAgendaItem ? getPlenaryRoute({ aid: nextAgendaItem.pk }) : '/'
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

<style scoped lang="sass">
.v-toolbar-title small
  opacity: var(--v-disabled-opacity)
  margin-left: 17px
  margin-top: -6px
  font-size: .65em
</style>
