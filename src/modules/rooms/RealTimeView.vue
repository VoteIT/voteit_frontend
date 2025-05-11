<script setup lang="ts">
import { computed, onBeforeUnmount, provide } from 'vue'
import { ReadonlyViewKey, RoleContextKey } from '@/injectionKeys'
import { useI18n } from 'vue-i18n'

import useChannel from '@/composables/useChannel'

import UserActiveDialog from '../active/UserActiveDialog.vue'
import useAgendaItem from '../agendas/useAgendaItem'
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
import { proposalHighlightEvent } from './events'

provide(RoleContextKey, 'meeting')

const { t } = useI18n()

const { highlightedProposals, meetingRoom, passiveMode, textSize } = useRoom()
provide(ReadonlyViewKey, passiveMode)

const { agendaItem } = useAgendaItem(
  computed(() => meetingRoom.value?.agenda_item ?? -1) // Can be undefined
)

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

/**
 * Deselect can't be picked up in proposals
 */
const evt = proposalHighlightEvent.on((evt) => {
  if (evt.room !== meetingRoom.value?.pk || evt.proposal) return
  getSelection()?.removeAllRanges()
})
onBeforeUnmount(evt.dispose)
</script>

<template>
  <AppBar />
  <UserActiveDialog v-if="!passiveMode" />
  <v-main :class="`text-size-${textSize}`">
    <div v-if="!meetingRoom?.open" class="text-center pa-6">
      <v-icon icon="mdi-broadcast-off" size="x-large" color="warning" /><br />
      <em>
        {{ $t('room.closed') }}
      </em>
    </div>
    <div v-else-if="paused" class="pa-6">
      <div
        v-if="meetingRoom.body"
        v-html="meetingRoom.body"
        class="paus-message text-center my-8"
      ></div>
      <p v-else class="paus-message text-center my-8">
        {{ $t('room.paused') }}
      </p>
      <ClockFace v-if="meetingRoom.show_time" :target-time="targetTime" />
    </div>
    <div v-else class="d-flex">
      <div v-if="display.speakers" class="left flex-grow-1 pa-6">
        <ActiveSpeakerList
          :passive="passiveMode"
          :system-id="speakerSystemActive!.pk"
        />
      </div>
      <div v-if="display.proposals" class="right flex-grow-1 pa-6">
        <h2 class="mb-2">
          <small>{{ $t('proposal.proposals') }}</small
          ><br />
          {{ agendaItem?.title }}
        </h2>
        <v-slide-x-transition group>
          <ProposalSheet
            v-for="p in highlightedProposals"
            read-only
            :key="p.pk"
            :proposal="p"
            :select-in-room="meetingRoom.pk"
            class="my-4"
          >
            <template #append>
              <div class="d-flex flex-wrap ga-1 mt-2">
                <ButtonPlugins mode="presentation" :proposal="p" />
              </div>
            </template>
            <template #bottom>
              <div
                v-if="p.state === ProposalState.Approved"
                class="bg-success-lighten-4 rounded-b py-2 px-4 d-flex"
              >
                <v-icon icon="mdi-check-circle" color="success" class="mr-2" />
                {{ $t('proposal.approved') }}
              </div>
              <div
                v-else-if="p.state === ProposalState.Denied"
                class="bg-warning-lighten-4 rounded-b py-2 px-4 d-flex"
              >
                <v-icon icon="mdi-close-circle" color="warning" class="mr-2" />
                {{ $t('proposal.denied') }}
              </div>
            </template>
          </ProposalSheet>
        </v-slide-x-transition>
      </div>
      <div v-if="!display.proposals && !display.speakers" class="flex-grow-1">
        <!-- In display mode is only one kind, and that type is not active -->
        <p class="text-center my-8">
          <em>
            {{ $t('room.nothingToDisplay') }}
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
  overflow-y: auto
  height: calc(100vh - var(--v-layout-bottom) - var(--v-layout-top))

.right
  background-color: rgba(0,0,0,.04)

.paus-message
  font-size: large !important
  .text-size-large &
    font-size: x-large !important
  .text-size-x-large &
    font-size: xx-large !important


.text-size-large
  :deep(.ql-editor ol),
  :deep(.ql-editor p),
  :deep(.ql-editor ul),
  :deep(.timer),
  :deep(.v-list-item-title),
  :deep(.proposal-text-paragraph)
    font-size: large !important

.text-size-x-large
  :deep(.ql-editor ol),
  :deep(.ql-editor p),
  :deep(.ql-editor ul),
  :deep(.timer),
  :deep(.v-list-item-title),
  :deep(.proposal-text-paragraph)
    font-size: x-large !important

h2
  line-height: 1.2
  small
    font-size: .9rem !important
</style>
