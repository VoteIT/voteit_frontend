<script setup lang="ts">
import { computed } from 'vue'

import useAgendaItem from '../agendas/useAgendaItem'
import useMeeting from '../meetings/useMeeting'
import useRoom from './useRoom'

const { meetingRoute } = useMeeting()
const { meetingRoom } = useRoom()
const { agendaItem, agendaItemRoute } = useAgendaItem(
  computed(() => meetingRoom.value?.agenda_item || undefined)
)

const crumbs = computed(() => {
  return [
    { title: meetingRoom.value?.title ?? '' },
    { title: agendaItem.value?.title ?? '' }
  ]
})
</script>

<template>
  <v-app-bar flat color="app-bar">
    <router-link :to="agendaItemRoute ?? meetingRoute">
      <img src="@/assets/voteit-logo.svg" alt="VoteIT" id="navbar-logo" />
    </router-link>
    <v-app-bar-title class="text-truncate">
      <v-breadcrumbs :items="crumbs" />
    </v-app-bar-title>
  </v-app-bar>
</template>
