<script setup lang="ts">
import useMeeting from '../meetings/useMeeting'

const { meetingId } = useMeeting()
</script>

<template>
  <h2>Hello!</h2>
  <h2 class="mb-4">
    <em>I said "Hell no". </em>
  </h2>
  <v-btn
    :to="{ name: 'realTime:main', params: { id: meetingId } }"
    color="primary"
    prepend-icon="mdi-motion-play"
    >Realtid</v-btn
  >
</template>
