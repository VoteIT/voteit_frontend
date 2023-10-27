<!-- eslint-disable camelcase -->
<script setup lang="ts">
import { isString } from 'lodash'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import useMeeting from '../meetings/useMeeting'
import useRooms from '../rooms/useRooms'

const { t } = useI18n()

const { meetingId } = useMeeting()
const { meetingRooms } = useRooms(meetingId)

const broadcasting = computed(() =>
  meetingRooms.value
    .filter((r) => r.active)
    .map(({ pk, title, send_proposals, send_sls }) => {
      const subtitles = [
        send_sls && t('speaker.list'),
        send_proposals && t('proposal.proposals')
      ].filter(isString)
      const subtitle = subtitles.length
        ? subtitles.join(', ')
        : t('room.paused')
      return {
        pk,
        subtitle,
        title
      }
    })
)
</script>

<template>
  <h2 class="mb-1">{{ t('rooms.broadcastAvailable') }}</h2>
  <v-list color="primary">
    <v-list-item
      v-for="{ pk, ...props } in broadcasting"
      :key="pk"
      v-bind="props"
      :to="{
        name: 'realTime:main',
        params: { id: meetingId, roomId: pk }
      }"
      active
      append-icon="mdi-chevron-right"
      class="mt-1"
    />
  </v-list>
</template>
