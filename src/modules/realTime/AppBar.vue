<template>
  <v-app-bar app flat color="app-bar">
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
    <div class="d-flex">
      <v-switch v-model="leftActive" label="Left" hide-details class="mr-3" />
      <v-switch v-model="rightActive" label="Right" hide-details class="mr-3" />
    </div>
  </v-app-bar>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import useAgenda from '../agendas/useAgenda'
import useAgendaItem from '../agendas/useAgendaItem'
import useMeeting from '../meetings/useMeeting'
import useRealTime from './useRealTime'

const { meetingId, meetingRoute } = useMeeting()
const { agenda } = useAgenda(meetingId)
const { agendaItem, agendaItemRoute } = useAgendaItem(
  computed(() => agenda.value[0]?.pk)
)
const { leftActive, rightActive } = useRealTime(meetingId)
</script>
