<template>
  <template v-if="meeting?.dialect">
    <v-card-text>
      <strong>{{ meeting.dialect.title }}:</strong>
      {{ meeting.dialect.description }}
    </v-card-text>
  </template>
</template>

<script lang="ts" setup>
import useMeeting from '../useMeeting'

const { meeting } = useMeeting()
</script>
