<script setup lang="ts">
import { computed, provide } from 'vue'
import { RoleContextKey } from '@/injectionKeys'
import { useI18n } from 'vue-i18n'

import useChannel from '@/composables/useChannel'
import useMeetingChannel from '../meetings/useMeetingChannel'
import useMeetingTitle from '../meetings/useMeetingTitle'
import ProposalSheet from '../proposals/ProposalSheet.vue'
import { ProposalState } from '../proposals/types'
import ButtonPlugins from '../proposals/ButtonPlugins.vue'
import useRoom from '../rooms/useRoom'
import ActiveSpeakerList from '../speakerLists/ActiveSpeakerList.vue'
import { findSpeakerSystem } from '../speakerLists/useSpeakerLists'

import ClockFace from './ClockFace.vue'
import AppBar from './AppBar.vue'
import { roomDisplayMode } from './displayOptions'

provide(RoleContextKey, 'meeting')

const { t } = useI18n()

const { highlightedProposals, meetingRoom, textSize } = useRoom()

useChannel(
  'agenda_item',
  computed(() => meetingRoom.value?.agenda_item || undefined) // null not acceptable in useChannel
)
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
  return findSpeakerSystem((s) => s.room === meetingRoom.value?.pk)
})
const proposalsActive = computed(() => !!meetingRoom.value?.send_proposals)
const paused = computed(
  () => !(speakerSystemActive.value || proposalsActive.value)
)
const display = computed<{ speakers: boolean; proposals: boolean }>(() => {
  const speakers = !!speakerSystemActive.value
  const proposals = proposalsActive.value
  switch (roomDisplayMode.value) {
    case 'onlyProposals':
      return { speakers: false, proposals }
    case 'onlySpeakers':
      return { speakers, proposals: false }
    case 'prioritizeProposals':
      return { speakers: speakers && !proposals, proposals }
    case 'prioritizeSpeakers':
      return { speakers: speakers, proposals: proposals && !speakers }
    default:
      return { speakers, proposals }
  }
})
</script>

<template>
  <AppBar />
  <v-main :class="`text-size-${textSize}`">
    <div v-if="!meetingRoom?.open" class="text-center pa-6">
      <v-icon icon="mdi-broadcast-off" size="x-large" color="warning" /><br />
      <em>
        {{ t('room.closed') }}
      </em>
    </div>
    <div v-else-if="paused" class="pa-6">
      <div
        v-if="meetingRoom.body"
        v-html="meetingRoom.body"
        class="text-center text-h6 my-8"
      ></div>
      <h2 v-else class="text-center my-8">
        {{ t('room.paused') }}
      </h2>
      <ClockFace v-if="meetingRoom.show_time" :target-time="targetTime" />
    </div>
    <div v-else class="d-flex full-height">
      <div v-if="display.speakers" class="left flex-grow-1 pa-6">
        <ActiveSpeakerList :system-id="speakerSystemActive!.pk" />
      </div>
      <div v-if="display.proposals" class="right flex-grow-1 pa-6">
        <h2>
          {{ t('proposal.proposals') }}
        </h2>
        <v-slide-x-transition group>
          <ProposalSheet
            v-for="p in highlightedProposals"
            read-only
            :key="p.pk"
            :proposal="p"
            class="my-4"
          >
            <template #append>
              <ButtonPlugins mode="presentation" :proposal="p" class="mt-2" />
            </template>
            <template #bottom>
              <div
                v-if="p.state === ProposalState.Approved"
                class="bg-success-lighten-4 rounded-b py-2 px-4 d-flex"
              >
                <v-icon icon="mdi-check-circle" color="success" class="mr-2" />
                {{ t('proposal.approved') }}
              </div>
              <div
                v-else-if="p.state === ProposalState.Denied"
                class="bg-warning-lighten-4 rounded-b py-2 px-4 d-flex"
              >
                <v-icon icon="mdi-close-circle" color="warning" class="mr-2" />
                {{ t('proposal.denied') }}
              </div>
            </template>
          </ProposalSheet>
        </v-slide-x-transition>
      </div>
      <div v-if="!display.proposals && !display.speakers" class="flex-grow-1">
        <!-- In display mode is only one kind, and that type is not active -->
        <p class="text-center my-8">
          <em>
            {{ t('room.nothingToDisplay') }}
          </em>
        </p>
      </div>
    </div>
  </v-main>
</template>

<style scoped lang="sass">
.left,
.right
  flex-basis: 50%

.right
  background-color: rgba(0,0,0,.04)

.full-height
  height: 100%

.text-size-large::v-deep
  .richtext p,
  .timer,
  .v-list-item-title
    font-size: large !important

.text-size-x-large::v-deep
  .richtext p,
  .timer,
  .v-list-item-title
    font-size: x-large !important
</style>
