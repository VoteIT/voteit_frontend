<!-- eslint-disable camelcase -->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import useMeeting from '../meetings/useMeeting'
import useRooms from '../rooms/useRooms'
import { IMeetingRoom } from './types'
import { autoEllipsis } from '@/utils'

const { t } = useI18n()

const { meetingId, getMeetingRoute } = useMeeting()
const { meetingRooms } = useRooms(meetingId)

function getSubtitle({ body, send_proposals, send_sls }: IMeetingRoom): string {
  switch (`${send_proposals}${send_sls}` as const) {
    case 'falsefalse': {
      const ellipsed = body ? autoEllipsis(body, 20, true) : ''
      return ellipsed.length ? ellipsed : t('room.noBroadcast')
    }
    case 'truefalse':
      return t('room.sendingProposals')
    case 'falsetrue':
      return t('room.sendingSpeakers')
    case 'truetrue':
      return t('room.sendingSpeakersProposals')
  }
}

const broadcasting = computed(() =>
  meetingRooms.value
    .filter((r) => r.open)
    .map((room) => ({
      pk: room.pk,
      subtitle: getSubtitle(room),
      title: room.title
    }))
)
</script>

<template>
  <h2 class="mb-1">{{ t('room.realTime') }}</h2>
  <v-list color="primary">
    <v-list-item
      v-for="{ pk, ...props } in broadcasting"
      :key="pk"
      v-bind="props"
      :to="getMeetingRoute('rooms:main', { roomId: pk })"
      active
      append-icon="mdi-chevron-right"
      class="mt-1"
    />
  </v-list>
</template>
