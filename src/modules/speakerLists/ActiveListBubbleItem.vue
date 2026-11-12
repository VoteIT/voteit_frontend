<script setup lang="ts">
import { computed } from 'vue'

import User from '@/components/User.vue'
import useChannel from '@/socket/useChannel'
import { slugify } from '@/utils'

import useAgendaStore from '../agendas/useAgendaStore'
import useMeeting from '../meetings/useMeeting'
import { roomChannel } from '../rooms/contentTypes'
import useRoom from '../rooms/useRoom'
import useRoomStore from '../rooms/useRoomStore'

import EnterLeaveButton from './EnterLeaveButton.vue'
import SpeakerQueue from './SpeakerQueue.vue'
import { canChangeSpeakerList } from './rules'
import { SpeakerSystem } from './types'
import useSpeakerStore from './useSpeakerStore'

const props = defineProps<{
  open: boolean
  system: SpeakerSystem
}>()
const emit = defineEmits(['update:modelValue'])

const { meeting } = useMeeting()
const { getAgendaItem } = useAgendaStore()
const { getRoom } = useRoomStore()
const { getSpeakerList } = useSpeakerStore()
const { getRoomRoute } = useRoom()

function close() {
  emit('update:modelValue', false)
}

// The room channel carries the active list and its speakers. Only subscribed
// while the bubble is open.
useChannel(
  roomChannel,
  computed(() => (props.open ? props.system.room : undefined))
)

const list = computed(() =>
  props.system.active_list
    ? getSpeakerList(props.system.active_list)
    : undefined
)
const room = computed(() => getRoom(props.system.room))
const roomParams = computed(() => ({
  id: props.system.meeting,
  roomId: props.system.room
}))
const isBroadcasted = computed(
  () => !!(room.value?.open && room.value.send_sls)
)
const canChange = computed(
  () => !!list.value && canChangeSpeakerList(list.value)
)
const agendaItemRoute = computed(() => {
  if (!list.value) return
  return {
    name: 'agendaItem',
    params: {
      id: props.system.meeting,
      slug: slugify(meeting.value?.title),
      aid: list.value.agenda_item,
      aslug: slugify(getAgendaItem(list.value.agenda_item)?.title)
    }
  }
})
</script>

<template>
  <div class="py-3">
    <template v-if="list">
      <div class="d-flex align-start mb-2">
        <div class="flex-grow-1 overflow-hidden">
          <h3 class="text-truncate">
            <router-link :to="agendaItemRoute!" @click="close">
              {{ list.title }}
            </router-link>
          </h3>
          <p :class="list.is_open ? 'text-secondary' : 'text-warning'">
            <v-icon v-if="!list.is_open" icon="mdi-lock" size="small" />
            {{
              list.is_open
                ? $t('speaker.listWorkflow.open')
                : $t('speaker.listWorkflow.closed')
            }}
          </p>
        </div>
        <v-btn
          v-if="isBroadcasted"
          icon="mdi-television-play"
          v-tooltip="$t('speaker.fullscreen')"
          size="small"
          variant="text"
          color="primary"
          :to="getRoomRoute('room:main', roomParams)"
          @click="close"
        />
        <v-btn
          v-if="canChange"
          icon="mdi-bullhorn"
          size="small"
          v-tooltip="$t('speaker.manage')"
          variant="text"
          color="primary"
          :to="
            getRoomRoute('room:broadcast', {
              ...roomParams,
              aid: list.agenda_item,
              tab: 'discussion'
            })
          "
          @click="close"
        />
      </div>
      <p v-if="list.current" class="mb-2">
        {{ $t('speaker.currentlySpeaking') }}:
        <strong><User :pk="list.current" /></strong>
      </p>
      <SpeakerQueue :list="list" />
      <EnterLeaveButton :list="list" />
    </template>
    <v-progress-linear v-else indeterminate color="secondary" />
  </div>
</template>

<style scoped lang="sass">
h3 a
  color: rgb(var(--v-theme-on-surface))
  text-decoration: none
  &:hover
    text-decoration: underline
</style>
