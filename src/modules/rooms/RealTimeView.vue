<script setup lang="ts">
import { computed, onBeforeUnmount, provide, shallowRef } from 'vue'
import { ReadonlyViewKey } from '@/injectionKeys'
import { useI18n } from 'vue-i18n'

import { slugify } from '@/utils'
import useChannel from '@/socket/useChannel'

import UserActiveDialog from '../active/UserActiveDialog.vue'
import { agendaItemChannel } from '../agendas/contentTypes'
import useAgendaStore from '../agendas/useAgendaStore'
import useMeetingTitle from '../meetings/useMeetingTitle'
import useMeeting from '../meetings/useMeeting'
import ProposalSheet from '../proposals/ProposalSheet.vue'
import { ProposalState } from '../proposals/types'
import ButtonPlugins from '../proposals/ButtonPlugins.vue'
import useRoom from '../rooms/useRoom'
import ActiveSpeakerList from '../speakerLists/ActiveSpeakerList.vue'
import useSpeakerStore from '../speakerLists/useSpeakerStore'

import ClockFace from './ClockFace.vue'
import AppBar from './AppBar.vue'
import { roomDisplayMode } from './displayOptions'
import { proposalHighlightEvent } from './events'
import { isTextHighlight, ProposalHighlight } from './types'

const { t } = useI18n()

const { getAgendaItem } = useAgendaStore()
const { meeting } = useMeeting()
const { highlightedProposals, meetingRoom, passiveMode, textSize } = useRoom()
const { findSpeakerSystem } = useSpeakerStore()
provide(ReadonlyViewKey, passiveMode)

const agendaItem = computed(() =>
  getAgendaItem(meetingRoom.value?.agenda_item ?? 0)
)

useChannel(
  agendaItemChannel,
  computed(() => meetingRoom.value?.agenda_item || undefined) // null not acceptable in useChannel
)
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
 * Text / proposal selection event
 */
const selection = shallowRef<ProposalHighlight>()
const textSelection = computed(() => {
  if (!selection.value || !isTextHighlight(selection.value)) return
  const { proposal, start, end } = selection.value
  return {
    proposal,
    range: { start, end }
  }
})
const evt = proposalHighlightEvent.on((evt) => {
  if (evt.room !== meetingRoom.value?.pk) return
  if (evt.proposal) selection.value = evt
  else {
    selection.value = undefined
    getSelection()?.removeAllRanges()
  }
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
        <ActiveSpeakerList :passive="passiveMode" :room="meetingRoom.pk" />
      </div>
      <div v-if="display.proposals" class="right flex-grow-1 pa-6">
        <h2 class="mb-2" v-if="agendaItem">
          <small>{{ $t('proposal.proposals') }}</small
          ><br />
          <router-link
            :to="{
              name: 'agendaItem',
              params: {
                slug: slugify(meeting?.title),
                aid: meetingRoom.agenda_item,
                aslug: slugify(agendaItem.title)
              }
            }"
          >
            {{ agendaItem.title }}
          </router-link>
        </h2>
        <v-slide-x-transition group>
          <ProposalSheet
            v-for="p in highlightedProposals"
            read-only
            :key="p.pk"
            :proposal="p"
            :selected="selection?.proposal === p.pk"
            :selection="
              textSelection?.proposal === p.pk ? textSelection.range : undefined
            "
            class="my-4"
          >
            <template #append>
              <div class="d-flex flex-wrap ga-1 mt-2">
                <ButtonPlugins
                  :mode="passiveMode ? 'presentation' : 'presentation:personal'"
                  :proposal="p"
                />
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
h2 a
  color: var(--v-theme-on-background)
  text-decoration: none
  &:hover
    text-decoration: underline

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
