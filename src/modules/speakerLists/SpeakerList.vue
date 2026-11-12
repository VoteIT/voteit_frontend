<script setup lang="ts">
import { computed, toRef } from 'vue'

import User from '@/components/User.vue'

import useRoom from '../rooms/useRoom'
import { IMeetingRoom } from '../rooms/types'

import { canChangeSpeakerList } from './rules'
import { SpeakerList } from './types'
import useSpeakerSystem from './useSpeakerSystem'
import EnterLeaveButton from './EnterLeaveButton.vue'
import SpeakerQueue from './SpeakerQueue.vue'

const props = defineProps<{
  list: SpeakerList
  room: IMeetingRoom
}>()

const { speakerSystem } = useSpeakerSystem(toRef(props.list, 'room'))
const { getRoomRoute } = useRoom()

const isActive = computed(
  () => speakerSystem.value?.active_list === props.list.pk
)

const canChange = computed(() => canChangeSpeakerList(props.list))

const fullscreenPath = computed(
  () =>
    props.room.open &&
    props.room.send_sls &&
    isActive.value && {
      name: 'room:main',
      params: {
        id: props.room.meeting,
        roomId: props.room.pk,
        aid: props.list.agenda_item,
        tab: 'discussion'
      }
    }
)
</script>

<template>
  <v-sheet class="speaker-list" :flat="!isActive" rounded elevation="4">
    <div class="pa-3">
      <h3 class="text-truncate mb-2">
        {{ list.title }}
      </h3>
      <p v-if="list.current" class="mb-2">
        {{ $t('speaker.currentlySpeaking') }}:
        <strong><User :pk="list.current" /></strong>
      </p>
      <SpeakerQueue :list="list" />
      <EnterLeaveButton :list="list" />
    </div>
    <template v-if="canChange || isActive">
      <v-divider />
      <div class="px-3 py-1">
        <v-btn
          v-if="fullscreenPath"
          color="primary"
          :to="fullscreenPath"
          :text="$t('speaker.fullscreen')"
          variant="text"
        />
        <v-btn
          v-if="canChange"
          color="primary"
          :text="$t('speaker.manage')"
          :to="
            getRoomRoute('room:broadcast', {
              id: room.meeting,
              roomId: room.pk,
              aid: list.agenda_item,
              tab: 'discussion'
            })
          "
          variant="text"
        />
      </div>
    </template>
    <div
      v-if="isActive"
      class="bg-success-lighten-4 rounded-b px-3 py-1 d-flex"
    >
      <v-icon icon="mdi-television-play" color="success" class="mr-2" />
      {{ $t('speaker.listActive') }}
      <v-spacer />
      <span v-if="!list.is_open">
        <v-icon class="mr-2" icon="mdi-lock" size="small" />
        {{ $t('speaker.listWorkflow.closed') }}
      </span>
    </div>
    <div
      v-else-if="!list.is_open"
      class="bg-grey-lighten-2 rounded-b px-3 py-1 d-flex"
    >
      <v-spacer />
      <div>
        <v-icon class="mr-2" icon="mdi-lock" size="small" />
        {{ $t('speaker.listWorkflow.closed') }}
      </div>
    </div>
  </v-sheet>
</template>

<style lang="sass">
.speaker-list
  ol
    padding-left: 1.5em
</style>
