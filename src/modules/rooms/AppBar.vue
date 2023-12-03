<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIdle } from '@vueuse/core'

import DefaultDialog from '@/components/DefaultDialog.vue'
import useMeeting from '../meetings/useMeeting'
import useRoom from './useRoom'
import RealTimePollModal from './RealTimePollModal.vue'
import { roomDisplayMode } from './displayOptions'

const { t } = useI18n()
const { meeting, meetingRoute } = useMeeting()
const { meetingRoom, roomOpenPoll } = useRoom()

const { idle } = useIdle(5_000)

const crumbs = computed(() => {
  return [
    { title: meeting.value?.title ?? '', to: meetingRoute.value },
    { title: meetingRoom.value?.title ?? '' }
  ]
})

const hasOpenPoll = computed(() => !!roomOpenPoll.value)
const pollModalOpen = ref(!!roomOpenPoll.value)
watch(hasOpenPoll, (value) => (pollModalOpen.value = value))

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
      <v-breadcrumbs :items="crumbs" />
    </v-app-bar-title>
    <DefaultDialog :model-value="pollModalOpen" :title="roomOpenPoll?.title">
      <template #activator="{ props }">
        <v-fade-transition>
          <v-btn
            prepend-icon="mdi-star"
            v-show="hasOpenPoll"
            :text="t('room.polls')"
            v-bind="props"
          />
        </v-fade-transition>
      </template>
      <RealTimePollModal v-if="roomOpenPoll" :poll="roomOpenPoll" />
    </DefaultDialog>
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
      <v-list>
        <v-item-group mandatory v-model="roomDisplayMode">
          <v-item
            v-for="{ value, ...props } in displayOptions"
            :key="value"
            :value="value"
            v-slot="{ isSelected, toggle }"
          >
            <v-list-item v-bind="props" :active="isSelected" @click="toggle" />
          </v-item>
        </v-item-group>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>
