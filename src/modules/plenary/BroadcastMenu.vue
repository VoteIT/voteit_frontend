<script setup lang="ts">
import { reactive, watch } from 'vue'

import { autoEllipsis, slugify } from '@/utils'
import CheckableListItem from '@/components/CheckableListItem.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'
import HeaderMenu from '@/components/HeaderMenu.vue'
import RichtextEditor from '@/components/RichtextEditor.vue'

import useMeeting from '../meetings/useMeeting'
import useRoom from '../rooms/useRoom'
import { roomType } from '../rooms/contentTypes'
import { broadcastFollowAgendaItem } from './usePlenary'

const {
  hasSpeakerLists,
  isBroadcasting,
  meetingRoom,
  realTimeRoute,
  handleSpeaker,
  setOpen
} = useRoom()
const { isModerator, meeting } = useMeeting()

const pauseEdit = reactive({
  isOpen: false,
  body: meetingRoom.value?.body ?? '',
  show_time: meetingRoom.value?.show_time ?? true
})
watch(meetingRoom, (room) => {
  if (!room) return
  pauseEdit.body = room.body ?? ''
  pauseEdit.show_time = room.show_time
})

async function savePauseMessage(pauseBroadcast = false) {
  if (!meetingRoom.value) throw new Error('No meeting room')
  const { body, show_time } = pauseEdit
  const data = pauseBroadcast
    ? { body, show_time, send_proposals: false, send_sls: false }
    : { body, show_time }
  await roomType.api.patch(meetingRoom.value.pk, data)
  pauseEdit.isOpen = false
}
</script>

<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn
        append-icon="mdi-chevron-down"
        class="mr-2"
        :color="isBroadcasting ? 'yellow' : undefined"
        :text="$t('room.broadcast')"
        :variant="isBroadcasting ? 'flat' : undefined"
        v-bind="props"
      />
    </template>
    <HeaderMenu
      icon="mdi-broadcast"
      :icon-color="isBroadcasting ? 'warning' : undefined"
      :subtitle="
        isBroadcasting ? $t('room.isBroadcasting') : $t('room.broadcastDesc')
      "
      max-width="340"
      :title="$t('room.broadcast')"
    >
      <v-list v-if="meetingRoom">
        <CheckableListItem
          v-if="isModerator"
          :model-value="meetingRoom.open"
          :subtitle="
            meetingRoom.open
              ? $t('room.isOpenDescription')
              : $t('room.isNotOpenDescription')
          "
          :title="$t('room.isOpen')"
          @update:model-value="setOpen($event)"
        />
        <CheckableListItem
          v-if="hasSpeakerLists"
          :model-value="meetingRoom.send_sls"
          :disabled="!meetingRoom.open"
          :title="$t('room.displaySpeakers')"
          @update:model-value="handleSpeaker({ send_sls: $event })"
        />
        <CheckableListItem
          v-if="isModerator"
          :model-value="meetingRoom.send_proposals"
          :disabled="!meetingRoom.open"
          :title="$t('room.displayProposals')"
          @update:model-value="
            roomType.api.patch(meetingRoom.pk, { send_proposals: $event })
          "
        />
        <DefaultDialog
          :title="$t('room.pauseMessage')"
          v-model="pauseEdit.isOpen"
        >
          <template #activator="{ props }">
            <v-list-item
              prepend-icon="mdi-clock"
              v-bind="props"
              :active="
                meetingRoom.open &&
                !meetingRoom.send_sls &&
                !meetingRoom.send_proposals &&
                !!meetingRoom.body?.length
              "
              :title="$t('room.pauseMessage')"
              :subtitle="
                meetingRoom.body && autoEllipsis(meetingRoom.body, 20, true)
              "
            />
          </template>
          <template #default="{ close }">
            <v-alert type="info" class="my-3">
              {{ $t('room.pauseMessageDescription') }}
            </v-alert>
            <RichtextEditor v-model="pauseEdit.body" class="mb-2" />
            <v-switch
              v-model="pauseEdit.show_time"
              color="primary"
              :label="$t('room.showClock')"
            />
            <div class="text-right">
              <v-btn variant="text" @click="close" :text="$t('cancel')" />
              <v-btn
                color="primary"
                @click="savePauseMessage()"
                :text="$t('save')"
              />
              <v-btn
                class="ml-1"
                prepend-icon="mdi-broadcast-off"
                color="primary"
                @click="savePauseMessage(true)"
                :text="$t('plenary.saveAndPauseBroadcast')"
              />
            </div>
          </template>
        </DefaultDialog>
        <CheckableListItem
          :subtitle="$t('plenary.follow.subtitle')"
          :title="$t('plenary.follow.title')"
          v-model="broadcastFollowAgendaItem"
        />
        <v-divider v-if="isModerator" class="mt-2" />
        <v-list-item
          v-if="isModerator"
          append-icon="mdi-chevron-right"
          :to="realTimeRoute"
          :title="$t('plenary.toRealTimeView')"
        />
        <v-list-item
          v-if="isModerator"
          append-icon="mdi-chevron-right"
          :to="{
            name: 'controlPanel',
            params: { panel: 'rooms', slug: slugify(meeting?.title) }
          }"
          :title="$t('room.settings')"
        />
      </v-list>
    </HeaderMenu>
  </v-menu>
</template>
