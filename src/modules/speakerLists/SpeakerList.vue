<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

import User from '@/components/User.vue'
import { user } from '@/composables/useAuthentication'

import useMeeting from '../meetings/useMeeting'
import { IMeetingRoom } from '../rooms/types'

import { canChangeSpeakerList } from './rules'
import { SpeakerList } from './types'
import useSpeakerSystem from './useSpeakerSystem'
import useSpeakerList from './useSpeakerList'

const props = defineProps<{
  list: SpeakerList & { room: IMeetingRoom }
}>()

const { t } = useI18n()
const { getMeetingRoute } = useMeeting()

const { speakerSystem } = useSpeakerSystem(toRef(props.list, 'speaker_system'))
const { canEnterList, canLeaveList, enterList, leaveList } = useSpeakerList(
  toRef(props.list, 'pk')
)
const isActive = computed(
  () => speakerSystem.value?.active_list === props.list.pk
)
const expandQueue = ref(false)

const enterLeaveBtn = computed(() => {
  if (canEnterList.value) {
    return {
      prependIcon: 'mdi-playlist-plus',
      text: t('speaker.enterList'),
      color: 'primary',
      onClick: enterList
    }
  }
  if (canLeaveList.value) {
    return {
      prependIcon: 'mdi-playlist-remove',
      text: t('speaker.leaveList'),
      color: 'warning',
      onClick: leaveList
    }
  }
  return undefined
})

const canChange = computed(() => canChangeSpeakerList(props.list))

const fullscreenPath = computed(
  () =>
    props.list.room.open &&
    isActive.value &&
    getMeetingRoute('rooms:main', {
      aid: props.list.agenda_item,
      roomId: props.list.room.pk,
      tab: 'discussion'
    })
)
</script>

<template>
  <v-card
    class="speaker-list mb-2"
    :title="list.title"
    :border="isActive"
    :flat="!isActive"
    :subtitle="isActive ? t('speaker.listActive') : t('speaker.list')"
  >
    <v-card-text>
      <p v-if="list.current" class="mb-2">
        {{ t('speaker.currentlySpeaking') }}:
        <strong><User :pk="list.current" /></strong>
      </p>
      <h3>
        {{ t('speaker.queue') }}
        <v-btn
          :class="{ expanded: expandQueue }"
          variant="text"
          size="small"
          v-if="
            list.queue.length > 1 &&
            (list.queue.length !== 2 || list.queue[1] !== user?.pk)
          "
          @click="expandQueue = !expandQueue"
          icon="mdi-chevron-down"
        />
      </h3>
      <div v-if="list.queue.length">
        <template v-for="(userPk, i) in list.queue" :key="userPk">
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
      <p v-else>
        <em>{{ t('speaker.queueEmpty') }}</em>
      </p>
    </v-card-text>
    <v-card-actions v-if="enterLeaveBtn" class="flex-wrap">
      <v-btn variant="elevated" v-bind="enterLeaveBtn" />
      <v-btn
        :to="
          getMeetingRoute('Plenary', {
            aid: list.agenda_item,
            roomId: list.room.pk,
            tab: 'discussion'
          })
        "
        prepend-icon="mdi-bullhorn"
        v-if="canChange"
      >
        {{ t('manage') }}
      </v-btn>
      <div class="d-flex flex-grow-1">
        <v-spacer />
        <v-btn v-if="fullscreenPath" :to="fullscreenPath" icon="mdi-overscan" />
      </div>
    </v-card-actions>
  </v-card>
</template>

<style lang="sass">
.speaker-list
  .btn-controls
    float: right

  h3 .mdi
    cursor: pointer

  ol
    padding-left: 1.5em

  .self
    font-weight: 700

  .mdi-chevron-down
    transition: transform .2s
  .expanded .mdi-chevron-down
    transform: rotate(180deg)
</style>
