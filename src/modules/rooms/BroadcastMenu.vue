<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import DefaultDialog from '@/components/DefaultDialog.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import RichtextEditor from '@/components/RichtextEditor.vue'
import useAgenda from '../agendas/useAgenda'
import useMeeting from '../meetings/useMeeting'
import useUserDetails from '../organisations/useUserDetails'
import usePlenary from '../plenary/usePlenary'
import useRoom from './useRoom'
import { roomType } from './contentTypes'

const { t } = useI18n()
const {
  isBroadcasting,
  meetingRoom,
  setBroadcast,
  setProposalBroadcast,
  setSlsBroadcast
} = useRoom()
const { meetingId } = useMeeting()
const { agendaId } = useAgenda(meetingId)
const { selectedProposalIds } = usePlenary(meetingId, agendaId)
const { getUser } = useUserDetails()

const broadcastStatusText = computed(() => {
  if (!meetingRoom.value) return
  if (isBroadcasting.value) return t('room.broadcasting')
  const { active, handler } = meetingRoom.value
  if (active && handler)
    return t('room.broadcastingUser', { ...getUser(handler) })
  return t('room.noBroadcast')
})

const broadcastConfirmText = computed(() => {
  if (!meetingRoom.value) return
  if (isBroadcasting.value) return t('room.confirmBroadcastStop')
  return meetingRoom.value.active
    ? t('room.confirmBroadcastTakeover')
    : t('room.confirmBroadcastStart')
})

const pauseEdit = reactive({
  isOpen: false,
  body: meetingRoom.value?.body ?? ''
})

async function savePauseMessage() {
  if (!meetingRoom.value) throw new Error('No meeting room')
  await roomType.api.patch(meetingRoom.value.pk, { body: pauseEdit.body })
  pauseEdit.isOpen = false
}

async function toggleBroadcast() {
  if (isBroadcasting.value) setBroadcast(false)
  else
    setBroadcast(true, {
      agenda_item: agendaId.value,
      proposals: [...selectedProposalIds]
    })
}
</script>

<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn icon="mdi-cogs" v-bind="props" />
    </template>
    <v-list v-if="meetingRoom">
      <v-list-item
        :prepend-icon="
          meetingRoom.send_sls
            ? 'mdi-checkbox-marked-outline'
            : 'mdi-checkbox-blank-outline'
        "
        :active="meetingRoom.send_sls"
        :title="t('room.displaySpeakers')"
        @click.stop="setSlsBroadcast(!meetingRoom.send_sls)"
      />
      <v-list-item
        :prepend-icon="
          meetingRoom.send_proposals
            ? 'mdi-checkbox-marked-outline'
            : 'mdi-checkbox-blank-outline'
        "
        :active="meetingRoom.send_proposals"
        :title="t('room.displayProposals')"
        @click.stop="setProposalBroadcast(!meetingRoom.send_proposals)"
      />
      <DefaultDialog :title="t('room.pauseMessage')" v-model="pauseEdit.isOpen">
        <template #activator="{ props }">
          <v-list-item prepend-icon="mdi-clock" v-bind="props">
            {{ t('room.pauseMessage') }}
          </v-list-item>
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
    </v-list>
  </v-menu>
  <v-spacer />
  <QueryDialog @confirmed="toggleBroadcast" color="warning">
    <template #activator="{ props }">
      {{ broadcastStatusText }}
      <v-btn
        :icon="meetingRoom?.active ? 'mdi-broadcast' : 'mdi-broadcast-off'"
        v-bind="props"
        :color="isBroadcasting ? 'warning' : undefined"
      />
    </template>
    {{ broadcastConfirmText }}
  </QueryDialog>
</template>
