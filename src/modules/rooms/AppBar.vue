<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIdle } from '@vueuse/core'

import DefaultDialog from '@/components/DefaultDialog.vue'
import HeaderMenu from '@/components/HeaderMenu.vue'
import useAgenda from '../agendas/useAgenda'
import useMeeting from '../meetings/useMeeting'
import useMeetingPolls from '../polls/useMeetingPolls'

import RealTimePollModal from './RealTimePollModal.vue'
import { roomDisplayMode } from './displayOptions'
import useRoom from './useRoom'

const { t } = useI18n()
const { isModerator, meeting, meetingId, meetingRoute } = useMeeting()
const { agenda } = useAgenda(meetingId)
const { meetingRoom, roomOpenPoll, textSize, getRoomRoute } = useRoom()
const { meetingOngoingPolls } = useMeetingPolls(meetingId)

const { idle } = useIdle(5_000)

const textSizes = computed(() => {
  return [
    {
      value: 'normal',
      title: t('content.textSizeNormal')
    },
    {
      value: 'large',
      title: t('content.textSizeLarge')
    },
    {
      value: 'x-large',
      title: t('content.textSizeXLarge')
    }
  ]
})

const crumbs = computed(() => {
  return [
    { title: meeting.value?.title ?? '', to: meetingRoute.value },
    { title: meetingRoom.value?.title ?? '' }
  ]
})

const hasOpenPoll = computed(() => !!roomOpenPoll.value)
const isVoting = ref(false) // True if user could be voting in poll modal
const pollModalOpen = ref(!!roomOpenPoll.value)
const pollModalTitle = ref('') // Weird bidning, but it does the job for now
watch(hasOpenPoll, (value) => (pollModalOpen.value = isVoting.value || value)) // Do not close if user could be voting

const displayOptions: {
  value: (typeof roomDisplayMode)['value']
  prependIcon: string
  title: string
}[] = [
  {
    value: 'any',
    prependIcon: 'mdi-view-split-vertical',
    title: t('room.displayAny')
  },
  {
    value: 'prioritizeSpeakers',
    prependIcon: 'mdi-bullhorn',
    title: t('room.prioritizeSpeakers')
  },
  {
    value: 'onlySpeakers',
    prependIcon: 'mdi-bullhorn',
    title: t('room.onlySpeakers')
  },
  {
    value: 'prioritizeProposals',
    prependIcon: 'mdi-gavel',
    title: t('room.prioritizeProposals')
  },
  {
    value: 'onlyProposals',
    prependIcon: 'mdi-gavel',
    title: t('room.onlyProposals')
  }
]
const currentDisplay = computed(
  () => displayOptions.find(({ value }) => value === roomDisplayMode.value)!
)
</script>

<template>
  <v-app-bar flat color="app-bar">
    <router-link :to="meetingRoute">
      <img src="@/assets/voteit-logo.svg" alt="VoteIT" id="navbar-logo" />
    </router-link>
    <v-app-bar-title class="text-truncate">
      <v-fade-transition>
        <small v-show="!idle" class="position-absolute">
          {{ t('room.realTime') }}
        </small>
      </v-fade-transition>
      <v-breadcrumbs :items="crumbs" />
    </v-app-bar-title>
    <DefaultDialog
      :model-value="pollModalOpen"
      :persistent="idle"
      :title="pollModalTitle"
      @close="isVoting = false"
    >
      <template #activator="{ props }">
        <v-fade-transition>
          <v-btn
            prepend-icon="mdi-star"
            v-show="meetingOngoingPolls.length || hasOpenPoll"
            :text="t('room.polls', meetingOngoingPolls.length)"
            v-bind="props"
          />
        </v-fade-transition>
      </template>
      <RealTimePollModal
        :dismissible="!idle"
        :poll-id="roomOpenPoll?.pk"
        @update:isVoting="isVoting = $event"
        @update:title="pollModalTitle = $event"
      />
    </DefaultDialog>
    <v-fade-transition v-if="isModerator && meetingRoom && agenda.length">
      <v-btn
        v-show="!idle"
        :text="t('room.toPlenaryView')"
        append-icon="mdi-chevron-right"
        variant="tonal"
        :to="
          getRoomRoute('room:broadcast', {
            aid: meetingRoom.agenda_item || agenda[0].pk,
            tab: 'decisions'
          })
        "
      />
    </v-fade-transition>
    <v-menu>
      <template #activator="{ props, isActive }">
        <v-fade-transition>
          <v-btn
            v-show="isActive || !idle"
            v-bind="props"
            prepend-icon="mdi-format-size"
            append-icon="mdi-chevron-down"
            :text="t('content.textSize')"
          />
        </v-fade-transition>
      </template>
      <HeaderMenu :title="t('content.textSize')" icon="mdi-format-size">
        <v-list :selected="[textSize]" @update:selected="textSize = $event[0]">
          <v-list-item
            v-for="{ value, title } in textSizes"
            :key="value"
            :value="value"
            :title="title"
            :prepend-icon="
              textSize === value ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank'
            "
          />
        </v-list>
      </HeaderMenu>
    </v-menu>
    <v-menu>
      <template #activator="{ props, isActive }">
        <v-fade-transition>
          <v-btn
            v-show="isActive || !idle"
            v-bind="props"
            :prepend-icon="currentDisplay.prependIcon"
            append-icon="mdi-chevron-down"
            :text="currentDisplay.title"
          />
        </v-fade-transition>
      </template>
      <HeaderMenu
        :title="t('room.realTime')"
        :subtitle="t('room.displayOptions')"
        icon="mdi-television-play"
      >
        <v-list>
          <v-item-group mandatory v-model="roomDisplayMode">
            <v-item
              v-for="{ value, ...props } in displayOptions"
              :key="value"
              :value="value"
              v-slot="{ isSelected, toggle }"
            >
              <v-list-item
                v-bind="props"
                :active="isSelected"
                @click="toggle"
              />
            </v-item>
          </v-item-group>
        </v-list>
      </HeaderMenu>
    </v-menu>
  </v-app-bar>
</template>

<style scoped lang="sass">
.v-toolbar-title small
  opacity: var(--v-disabled-opacity)
  margin-left: 17px
  margin-top: -6px
  font-size: .65em
</style>
