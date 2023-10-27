<script setup lang="ts">
import { computed } from 'vue'

import useAgendaItem from '../agendas/useAgendaItem'
import useMeeting from '../meetings/useMeeting'
import useRoom from '../rooms/useRoom'

const { meetingRoute } = useMeeting()
const { meetingRoom } = useRoom()
const { agendaItem, agendaItemRoute } = useAgendaItem(
  computed(() => meetingRoom.value?.agenda_item || undefined)
)

const crumbs = computed(() => {
  return [
    {
      title: agendaItem.value?.title ?? '',
      to: agendaItemRoute.value
    },
    { title: meetingRoom.value?.title ?? '' }
  ]
})
</script>

<template>
  <v-app-bar flat color="app-bar">
    <router-link :to="meetingRoute">
      <img src="@/assets/voteit-logo.svg" alt="VoteIT" id="navbar-logo" />
    </router-link>
    <v-app-bar-title class="text-truncate">
      <v-breadcrumbs :items="crumbs" />
    </v-app-bar-title>
  </v-app-bar>
</template>
