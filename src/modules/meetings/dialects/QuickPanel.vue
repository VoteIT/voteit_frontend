<script lang="ts" setup>
import useMeeting from '../useMeeting'

const { meeting } = useMeeting()
</script>

<template>
  <v-card-text v-if="meeting?.dialect">
    <strong>{{ meeting.dialect.title }}:</strong>
    {{ meeting.dialect.description }}
  </v-card-text>
</template>
