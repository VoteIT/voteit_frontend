<script setup lang="ts">
import { computed } from 'vue'

import useMeeting from '../meetings/useMeeting'
import useRoom from './useRoom'

const { meeting, meetingRoute } = useMeeting()
const { meetingRoom } = useRoom()

const crumbs = computed(() => {
  return [
    { title: meeting.value?.title ?? '', to: meetingRoute.value },
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
