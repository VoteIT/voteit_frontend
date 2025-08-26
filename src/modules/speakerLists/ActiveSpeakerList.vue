<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Moment from '@/components/Moment.vue'

import { speakerListType } from './contentTypes'
import useSpeakerList from './useSpeakerList'
import useSpeakerSystem from './useSpeakerSystem'
import EnterLeaveButton from './EnterLeaveButton.vue'
import SpeakerEntry from './SpeakerEntry.vue'
import { CurrentSpeaker, QueuedSpeaker } from './types'
import useSpeakerGroups from './useSpeakerGroups'

const props = defineProps<{
  passive: boolean
  room: number
}>()

const { t } = useI18n()

const { getState } = speakerListType.useWorkflows()
const {
  systemActiveList: list,
  systemActiveListId,
  speakerSystem: system,
  currentSpeakerQueue: queue
} = useSpeakerSystem(computed(() => props.room))
const { currentSpeaker } = useSpeakerList(systemActiveListId)
const speakerGroups = useSpeakerGroups(systemActiveListId, t)

const listState = computed(() => list.value && getState(list.value.state))

type Annotated<T extends {}> = T & {
  annotations: { icon: string; text: string }[]
}

interface SpeakerGroup {
  active?: boolean
  title?: string
  queue: Annotated<QueuedSpeaker>[] | Annotated<CurrentSpeaker>[]
}

const groups = computed<SpeakerGroup[]>(() => {
  if (!list.value || !system.value || !queue.value || !speakerGroups.value)
    return []
  return currentSpeaker.value
    ? [
        {
          active: true,
          title: t('speaker.currentlySpeaking'),
          queue: [currentSpeaker.value]
        },
        ...speakerGroups.value
      ]
    : speakerGroups.value
})
</script>

<template>
  <div v-if="list">
    <div class="d-sm-flex">
      <div class="flex-grow-1">
        <h2 class="mb-2 flex-grow-1">
          <small>{{ $t('speaker.list') }}</small
          ><br />
          {{ list.title }}
        </h2>
        <p class="mb-1" v-if="listState">- {{ listState.getName(t) }}</p>
      </div>
      <v-fade-transition>
        <EnterLeaveButton :list="list" />
      </v-fade-transition>
    </div>
    <p v-if="!currentSpeaker && !queue?.length" class="text-secondary">
      {{ $t('speaker.queueEmpty') }}
    </p>
    <v-list bg-color="background">
      <v-slide-x-transition group>
        <template v-for="{ active, title, queue } in groups">
          <div v-if="queue.length" :key="title" class="mt-6 mb-2">
            <p v-if="title" class="bg-background text-secondary pr-2">
              {{ title }}
            </p>
            <v-divider />
          </div>
          <SpeakerEntry
            v-for="{ pk, annotations, user } in queue"
            :key="pk"
            :annotations="annotations"
            :active="active"
            :user="user"
          >
            <template
              v-if="system?.show_time && active && currentSpeaker"
              #append
            >
              <span class="timer px-4 text-primary">
                <Moment in-seconds ordinary :date="currentSpeaker.started" />
              </span>
            </template>
          </SpeakerEntry>
        </template>
      </v-slide-x-transition>
    </v-list>
  </div>
  <h2 v-else>
    <small>{{ $t('speaker.list') }}</small
    ><br />
    <em>
      {{ $t('speaker.noActiveList') }}
    </em>
  </h2>
</template>

<style scoped lang="sass">
.timer
  background-color: rgba(var(--v-theme-primary), .08)
  border-radius: 3px

h2
  line-height: 1.2
  small
    font-size: .9rem !important
</style>
