<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { computed } from 'vue'

import { orderBy } from '@/utils'

import useMeetingId from '../meetings/useMeetingId'
import useRoomStore from '../rooms/useRoomStore'

import ActiveListBubbleItem from './ActiveListBubbleItem.vue'
import { hasActiveList } from './rules'
import useSpeakerStore from './useSpeakerStore'

defineProps<{ modelValue?: boolean }>()
const emit = defineEmits(['update:modelValue'])

const meetingId = useMeetingId()
const { getSpeakerSystems } = useSpeakerStore()
const { getRoom } = useRoomStore()

/**
 * Chosen room per meeting, when more than one room has an active list.
 */
const chosenRooms = useStorage<Record<number, number>>(
  'speakerBubble:chosenRoom',
  {}
)

const activeSystems = computed(() =>
  orderBy(
    getSpeakerSystems(meetingId.value, hasActiveList).map((system) => ({
      system,
      roomTitle: getRoom(system.room)?.title ?? ''
    })),
    'roomTitle'
  )
)

const selected = computed(() => {
  if (activeSystems.value.length === 1) return activeSystems.value[0]
  const room = chosenRooms.value[meetingId.value]
  return activeSystems.value.find(({ system }) => system.room === room)
})

function choose(room: number) {
  chosenRooms.value = { ...chosenRooms.value, [meetingId.value]: room }
}
</script>

<template>
  <div class="speaker-lists-bubble">
    <div class="d-flex pa-1 mb-2">
      <v-icon
        icon="mdi-bullhorn"
        size="xx-large"
        color="secondary"
        class="mr-4 mt-1"
      />
      <div class="flex-grow-1">
        <h2>{{ $t('speaker.bubbleTitle') }}</h2>
        <p class="text-secondary">
          {{ $t('speaker.bubbleDescription') }}
        </p>
      </div>
      <v-menu v-if="selected && activeSystems.length > 1">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            v-tooltip="$t('speaker.bubbleSwitch')"
            icon="mdi-swap-horizontal"
            size="small"
            variant="text"
          />
        </template>
        <v-list density="compact">
          <v-list-item
            v-for="{ system, roomTitle } in activeSystems"
            :key="system.pk"
            :active="system.pk === selected.system.pk"
            :title="roomTitle"
            @click="choose(system.room)"
          />
        </v-list>
      </v-menu>
    </div>
    <v-divider class="mx-n4" />
    <ActiveListBubbleItem
      v-if="selected"
      :key="selected.system.pk"
      :open="!!modelValue"
      :system="selected.system"
      @update:modelValue="emit('update:modelValue', $event)"
    />
    <v-list v-else class="mx-n2 mb-n3">
      <v-list-subheader>
        {{ $t('speaker.bubbleChoose') }}
      </v-list-subheader>
      <v-list-item
        v-for="{ system, roomTitle } in activeSystems"
        :key="system.pk"
        :title="roomTitle"
        append-icon="mdi-chevron-right"
        @click="choose(system.room)"
      />
    </v-list>
  </div>
</template>

<style scoped lang="sass">
.speaker-lists-bubble
  min-width: 300px
  max-width: 400px
</style>
