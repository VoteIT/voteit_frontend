<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

import User from '@/components/User.vue'
import { user } from '@/composables/useAuthentication'

import useRoom from '../rooms/useRoom'
import { IMeetingRoom } from '../rooms/types'

import { canChangeSpeakerList } from './rules'
import { SpeakerList } from './types'
import useSpeakerSystem from './useSpeakerSystem'
import useSpeakerList from './useSpeakerList'

const props = defineProps<{
  list: SpeakerList
  room: IMeetingRoom
}>()

const { t } = useI18n()

const { speakerSystem } = useSpeakerSystem(toRef(props.list, 'room'))
const { canEnterList, canLeaveList, currentSpeaker, enterList, leaveList } =
  useSpeakerList(toRef(props.list, 'pk'))
const { getRoomRoute } = useRoom()

const queue = computed(() =>
  currentSpeaker.value
    ? props.list.queue.filter((user) => user !== currentSpeaker.value?.user)
    : props.list.queue
)

const isActive = computed(
  () => speakerSystem.value?.active_list === props.list.pk
)
const expandQueue = ref(false)

const enterLeaveBtn = computed(() => {
  if (canEnterList.value)
    return {
      prependIcon: 'mdi-playlist-plus',
      text: t('speaker.enterList'),
      color: 'primary',
      onClick: enterList
    }
  if (canLeaveList.value)
    return {
      prependIcon: 'mdi-playlist-remove',
      text: t('speaker.leaveList'),
      color: 'warning',
      onClick: leaveList
    }
})

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
      <p v-if="currentSpeaker" class="mb-2">
        {{ $t('speaker.currentlySpeaking') }}:
        <strong><User :pk="currentSpeaker.user" /></strong>
      </p>
      <h4>
        {{ $t('speaker.queue') }}
        <v-btn
          :class="{ expanded: expandQueue }"
          variant="text"
          size="small"
          v-if="
            queue.length > 1 && (queue.length !== 2 || queue[1] !== user?.pk)
          "
          @click="expandQueue = !expandQueue"
          icon="mdi-chevron-down"
        />
      </h4>
      <div v-if="queue.length" class="mb-2">
        <template v-for="(userPk, i) in queue" :key="userPk">
          <v-expand-transition>
            <div
              :class="{ self: userPk === user?.pk }"
              v-show="expandQueue || i === 0 || userPk === user?.pk"
            >
              {{ i + 1 }}. <User :pk="userPk" />
            </div>
          </v-expand-transition>
        </template>
      </div>
      <p v-else class="mb-2">
        <em>{{ $t('speaker.queueEmpty') }}</em>
      </p>
      <v-btn v-if="enterLeaveBtn" variant="elevated" v-bind="enterLeaveBtn" />
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
    <div v-if="isActive" class="bg-success-lighten-4 rounded-b px-3 py-1">
      <v-icon icon="mdi-television-play" color="success" class="mr-2" />
      {{ $t('speaker.listActive') }}
    </div>
  </v-sheet>
</template>

<style lang="sass">
.speaker-list
  ol
    padding-left: 1.5em

  .self
    font-weight: 700

  .mdi-chevron-down
    transition: transform .2s
  .expanded .mdi-chevron-down
    transform: rotate(180deg)
</style>
