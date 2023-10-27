<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import useRoom from './useRoom'
import QueryDialog from '@/components/QueryDialog.vue'
import useUserDetails from '../organisations/useUserDetails'

const { t } = useI18n()
const {
  isBroadcasting,
  meetingRoom,
  setBroadcast,
  setProposalBroadcast,
  setSlsBroadcast
} = useRoom()
const { getUser } = useUserDetails()

const broadcastStatusText = computed(() => {
  if (!meetingRoom.value) return
  if (isBroadcasting.value) return t('room.broadcasting')
  const { active, handler } = meetingRoom.value
  if (active && handler)
    return t('room.broadcastingUser', getUser(handler) ?? {})
  return t('room.noBroadcast')
})

const broadcastConfirmText = computed(() => {
  if (!meetingRoom.value) return
  if (isBroadcasting.value) return t('room.confirmBroadcastStop')
  return meetingRoom.value.active
    ? t('room.confirmBroadcastTakeover')
    : t('room.confirmBroadcastStart')
})
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
    </v-list>
  </v-menu>
  <v-spacer />
  <QueryDialog @confirmed="setBroadcast(!isBroadcasting)" color="warning">
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
