<script setup lang="ts">
import { sorted } from 'itertools'
import { computed } from 'vue'

import useAgenda from '../agendas/useAgenda'
import useMeetingId from '../meetings/useMeetingId'
import useRooms from './useRooms'

const meetingId = useMeetingId()
const { agenda } = useAgenda(meetingId)
const { meetingRooms } = useRooms(meetingId)

const sortedRooms = computed(() => {
  const aid = agenda.value.at(0)?.pk
  if (!aid) return []
  return sorted(
    meetingRooms.value.map(({ open, pk, title }) => ({
      open,
      pk,
      title,
      to: {
        name: 'room:broadcast',
        params: {
          id: meetingId.value,
          roomId: pk,
          aid,
          tab: 'decisions'
        }
      }
    })),
    (r) => r.title.toLocaleLowerCase()
  )
})
</script>

<template>
  <v-card-actions v-if="sortedRooms.length" class="overflow-x-auto">
    <v-btn
      v-for="{ open, title, to } in sortedRooms"
      color="primary"
      :prepend-icon="open ? 'mdi-broadcast' : 'mdi-broadcast-off'"
      size="small"
      :to="to"
      :text="title"
      :variant="open ? 'flat' : 'tonal'"
      @click.prevent
    />
  </v-card-actions>
  <v-card-text v-else>
    <em>{{ $t('room.notConfigured') }}</em>
  </v-card-text>
</template>
