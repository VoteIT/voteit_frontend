<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { autoEllipsis, orderBy, titleSorter } from '@/utils'

import BubbleHeader from '../meetings/BubbleHeader.vue'
import useMeetingId from '../meetings/useMeetingId'
import useRooms from '../rooms/useRooms'

import { IMeetingRoom } from './types'

defineProps<{ modelValue?: boolean }>()
defineEmits(['update:modelValue'])

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
  <BubbleHeader
    icon="mdi-television-play"
    :title="$t('room.realTime')"
    :subtitle="$t('room.realTimeDescription')"
  />
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
