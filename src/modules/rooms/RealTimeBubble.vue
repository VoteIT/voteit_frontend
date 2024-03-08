<!-- eslint-disable camelcase -->
<script setup lang="ts">
import { orderBy } from 'lodash'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { autoEllipsis, titleSorter } from '@/utils'

import useMeetingId from '../meetings/useMeetingId'
import useRooms from '../rooms/useRooms'

import { IMeetingRoom } from './types'

const { t } = useI18n()

const meetingId = useMeetingId()
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
  orderBy(
    meetingRooms.value
      .filter((r) => r.open)
      .map((room) => ({
        pk: room.pk,
        active: room.send_proposals || room.send_sls,
        subtitle: getSubtitle(room),
        title: room.title
      })),
    ['active', titleSorter],
    ['desc', 'asc']
  )
)
</script>

<template>
  <div class="d-flex pa-1 mb-2 real-time-bubble">
    <v-icon
      icon="mdi-television-play"
      size="xx-large"
      color="secondary"
      class="mr-4 mt-1"
    />
    <div class="flex-grow-1">
      <h2>{{ t('room.realTime') }}</h2>
      <p class="text-secondary">
        {{ t('room.realTimeDescription') }}
      </p>
    </div>
  </div>
  <v-divider class="mx-n4" />
  <v-list class="mx-n2 mb-n3">
    <v-list-item
      v-for="{ active, subtitle, pk, ...props } in broadcasting"
      :key="pk"
      v-bind="props"
      :to="{ name: 'room:main', params: { id: meetingId, roomId: pk } }"
      append-icon="mdi-chevron-right"
      class="mt-1"
    >
      <template #subtitle>
        <v-icon
          v-if="active"
          icon="mdi-circle"
          color="success-lighten-2"
          size="xx-small"
          class="mr-1"
        />
        <em>{{ subtitle }}</em>
      </template>
    </v-list-item>
  </v-list>
</template>

<style scoped lang="sass">
.real-time-bubble
  min-width: 300px
</style>
