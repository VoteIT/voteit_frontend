<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { autoEllipsis } from '@/utils'
import DefaultDialog from '@/components/DefaultDialog.vue'
import RichtextEditor from '@/components/RichtextEditor.vue'
import useMeeting from '../meetings/useMeeting'
import useRoom from './useRoom'
import { roomType } from './contentTypes'
import HeaderMenu from '@/components/HeaderMenu.vue'

const { t } = useI18n()
const {
  hasSpeakerLists,
  meetingRoom,
  setOpen,
  setProposalBroadcast,
  setSlsBroadcast
} = useRoom()
const { isModerator, getMeetingRoute } = useMeeting()

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
      <v-btn append-icon="mdi-chevron-down" class="mr-2" v-bind="props">
        {{ t('room.broadcast') }}
      </v-btn>
    </template>
    <HeaderMenu
      icon="mdi-broadcast"
      :subtitle="t('room.broadcastDesc')"
      :title="t('room.broadcast')"
    >
      <v-list v-if="meetingRoom">
        <v-list-item
          v-if="isModerator"
          :prepend-icon="
            meetingRoom.open
              ? 'mdi-checkbox-marked'
              : 'mdi-checkbox-blank-outline'
          "
          :active="meetingRoom.open"
          :subtitle="
            meetingRoom.open
              ? t('room.isOpenDescription')
              : t('room.isNotOpenDescription')
          "
          :title="t('room.isOpen')"
          @click.stop="setOpen(!meetingRoom.open)"
        />
        <v-list-item
          v-if="hasSpeakerLists"
          :prepend-icon="
            meetingRoom.send_sls
              ? 'mdi-checkbox-marked'
              : 'mdi-checkbox-blank-outline'
          "
          :active="meetingRoom.send_sls"
          :disabled="!meetingRoom.open"
          :title="t('room.displaySpeakers')"
          @click.stop="setSlsBroadcast(!meetingRoom.send_sls)"
        />
        <v-list-item
          v-if="isModerator"
          :prepend-icon="
            meetingRoom.send_proposals
              ? 'mdi-checkbox-marked'
              : 'mdi-checkbox-blank-outline'
          "
          :active="meetingRoom.send_proposals"
          :disabled="!meetingRoom.open"
          :title="t('room.displayProposals')"
          @click.stop="setProposalBroadcast(!meetingRoom.send_proposals)"
        />
        <DefaultDialog
          :title="t('room.pauseMessage')"
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
              :title="t('room.pauseMessage')"
              :subtitle="
                meetingRoom.body && autoEllipsis(meetingRoom.body, 20, true)
              "
            />
          </template>
          <template #default="{ close }">
            <v-alert type="info" class="my-3">
              {{ t('room.pauseMessageDescription') }}
            </v-alert>
            <RichtextEditor
              v-model="pauseEdit.body"
              class="mb-2"
              @keydown.stop
            />
            <v-switch
              v-model="pauseEdit.show_time"
              color="primary"
              :label="t('room.showClock')"
            />
            <div class="text-right">
              <v-btn variant="text" @click="close" :text="t('cancel')" />
              <v-btn
                color="primary"
                @click="savePauseMessage()"
                :text="t('save')"
              />
              <v-btn
                class="ml-1"
                prepend-icon="mdi-broadcast-off"
                color="primary"
                @click="savePauseMessage(true)"
                :text="t('plenary.saveAndPauseBroadcast')"
              />
            </div>
          </template>
        </DefaultDialog>
        <v-divider v-if="isModerator" class="mt-2" />
        <v-list-item
          v-if="isModerator"
          append-icon="mdi-chevron-right"
          :to="getMeetingRoute('controlPanel', { panel: 'rooms' })"
          :title="t('room.settings')"
        />
      </v-list>
    </HeaderMenu>
  </v-menu>
</template>
