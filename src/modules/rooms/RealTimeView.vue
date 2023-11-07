<script setup lang="ts">
import { DateTime } from 'luxon'
import { computed, provide } from 'vue'
import { RoleContextKey } from '@/injectionKeys'
import { useI18n } from 'vue-i18n'

import useMeetingChannel from '../meetings/useMeetingChannel'
import Proposal from '../proposals/Proposal.vue'
import useRoom from '../rooms/useRoom'
import ActiveSpeakerList from '../speakerLists/ActiveSpeakerList.vue'

import ClockFace from './ClockFace.vue'
import AppBar from './AppBar.vue'
import { ProposalState } from '../proposals/types'
import useMeetingTitle from '../meetings/useMeetingTitle'

provide(RoleContextKey, 'meeting')

const { t } = useI18n()

const { highlightedProposals, meetingRoom } = useRoom()

useMeetingChannel()
useMeetingTitle(t('room.realTime'))

const targetTime = computed(() => {
  if (!meetingRoom.value?.body) return
  const pauseTime = meetingRoom.value.body.match(/(\d{2}):(\d{2})/)
  if (!pauseTime) return
  const date = new Date()
  date.setHours(Number(pauseTime[1]))
  date.setMinutes(Number(pauseTime[2]))
  date.setSeconds(0)
  date.setMilliseconds(0)
  return date
})

const speakerSystemActive = computed(() => {
  if (!meetingRoom.value?.send_sls) return
  return meetingRoom.value.sls
})
const proposalsActive = computed(() => !!meetingRoom.value?.send_proposals)
const paused = computed(
  () => !(speakerSystemActive.value || proposalsActive.value)
)
</script>

<template>
  <AppBar />
  <v-main class="ma-6">
    <div v-if="!meetingRoom?.open" class="text-center">
      <v-icon icon="mdi-broadcast-off" size="x-large" color="warning" /><br />
      <em>
        {{ t('room.noBroadcast') }}
      </em>
    </div>
    <div v-else-if="paused">
      <div
        v-if="meetingRoom.body"
        v-html="meetingRoom.body"
        class="text-center text-h6 my-8"
      ></div>
      <h2 v-else class="text-center my-8">
        {{ t('room.paused') }}
      </h2>
      <ClockFace :target-time="targetTime" />
    </div>
    <div v-else class="d-flex full-height">
      <div v-if="speakerSystemActive" class="left flex-grow-1">
        <ActiveSpeakerList :system-id="speakerSystemActive" />
      </div>
      <v-divider
        v-if="speakerSystemActive && proposalsActive"
        class="mx-5"
        vertical
      />
      <div v-if="meetingRoom.send_proposals" class="right flex-grow-1">
        <h2>
          {{ t('proposal.proposals') }}
        </h2>
        <v-slide-x-transition group>
          <Proposal
            v-for="p in highlightedProposals"
            read-only
            :key="p.pk"
            :p="p"
            class="my-4"
          >
            <template #actions>
              <v-icon
                v-if="p.state === ProposalState.Approved"
                icon="mdi-check-circle"
                color="success"
                size="x-large"
                class="mb-n2"
              />
              <v-icon
                v-if="p.state === ProposalState.Denied"
                icon="mdi-close-circle"
                color="warning"
                size="x-large"
                class="mb-n2"
              />
            </template>
          </Proposal>
        </v-slide-x-transition>
      </div>
    </div>
  </v-main>
</template>

<style scoped lang="sass">
.left,
.right
  flex-basis: 50%

.full-height
  height: 100%
</style>
