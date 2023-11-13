<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import DefaultDialog from '@/components/DefaultDialog.vue'
import RichtextEditor from '@/components/RichtextEditor.vue'
import useMeeting from '../meetings/useMeeting'
import useRoom from './useRoom'
import { roomType } from './contentTypes'
import { stripHTML } from '@/utils'

const { t } = useI18n()
const {
  isBroadcasting,
  meetingRoom,
  setOpen,
  setProposalBroadcast,
  setSlsBroadcast
} = useRoom()
const { isModerator, getMeetingRoute } = useMeeting()

const pauseEdit = reactive({
  isOpen: false,
  body: meetingRoom.value?.body ?? ''
})
watch(
  () => meetingRoom.value?.body,
  (body) => {
    pauseEdit.body = body ?? ''
  }
)
async function savePauseMessage() {
  if (!meetingRoom.value) throw new Error('No meeting room')
  await roomType.api.patch(meetingRoom.value.pk, { body: pauseEdit.body })
  pauseEdit.isOpen = false
}

function autoEllipse(text: string, maxLen = 16) {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '…'
}
</script>

<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn
        :icon="isBroadcasting ? 'mdi-broadcast' : 'mdi-broadcast-off'"
        v-bind="props"
      />
    </template>
    <v-list v-if="meetingRoom">
      <v-list-item
        v-if="isModerator"
        :prepend-icon="
          meetingRoom.open
            ? 'mdi-checkbox-marked-outline'
            : 'mdi-checkbox-blank-outline'
        "
        :active="meetingRoom.open"
        :title="t('room.open')"
        @click.stop="setOpen(!meetingRoom.open)"
      />
      <v-list-item
        :prepend-icon="
          meetingRoom.send_sls
            ? 'mdi-checkbox-marked-outline'
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
            ? 'mdi-checkbox-marked-outline'
            : 'mdi-checkbox-blank-outline'
        "
        :active="meetingRoom.send_proposals"
        :disabled="!meetingRoom.open"
        :title="t('room.displayProposals')"
        @click.stop="setProposalBroadcast(!meetingRoom.send_proposals)"
      />
      <DefaultDialog :title="t('room.pauseMessage')" v-model="pauseEdit.isOpen">
        <template #activator="{ props }">
          <v-list-item
            prepend-icon="mdi-clock"
            v-bind="props"
            :title="t('room.pauseMessage')"
            :subtitle="
              meetingRoom.body && autoEllipse(stripHTML(meetingRoom.body))
            "
          />
        </template>
        <template #default="{ close }">
          <v-alert type="info" class="my-3">
            {{ t('room.pauseMessageDescription') }}
          </v-alert>
          <RichtextEditor v-model="pauseEdit.body" class="mb-2" @keydown.stop />
          <div class="text-right">
            <v-btn variant="text" @click="close">
              {{ t('cancel') }}
            </v-btn>
            <v-btn color="primary" @click="savePauseMessage">
              {{ t('save') }}
            </v-btn>
          </div>
        </template>
      </DefaultDialog>
      <v-list-item
        v-if="isModerator"
        prepend-icon="mdi-cogs"
        :to="getMeetingRoute('controlPanel', { panel: 'rooms' })"
        :title="t('room.settings')"
      />
    </v-list>
  </v-menu>
</template>
