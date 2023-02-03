<template>
  <template v-if="meeting?.dialect">
    <v-card-text>
      <strong>{{ meeting.dialect.title }}:</strong>
      {{ meeting.dialect.description }}
    </v-card-text>
    <v-card-text>
      <strong>Roller: </strong>
      <v-chip v-for="{ role_id, title } in meeting.dialect.roles" :key="role_id" :text="title" />
    </v-card-text>
  </template>
</template>

<script lang="ts" setup>
import useMeeting from '../useMeeting'

const { meeting } = useMeeting()
</script>
