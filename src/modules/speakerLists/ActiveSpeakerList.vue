<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import useChannel from '@/composables/useChannel'
import useLoader from '@/composables/useLoader'
import useUserDetails from '../organisations/useUserDetails'

import { speakerListType } from './contentTypes'
import { SpeakerGroup } from './types'
import useSpeakerList from './useSpeakerList'
import useSpeakerSystem from './useSpeakerSystem'

const props = defineProps<{
  systemId: number
}>()

const { t } = useI18n()
const systemId = computed(() => props.systemId)
useLoader('ActiveSpeakerList', useChannel('sls', systemId).promise)

const { getState } = speakerListType.useWorkflows()
const { getUser } = useUserDetails()
const {
  systemActiveList: list,
  systemActiveListId,
  speakerSystem: system,
  currentSpeakerQueue: queue,
  currentlySpeaking: speaking
} = useSpeakerSystem(systemId)
const { speakerGroups } = useSpeakerList(systemActiveListId)

const listState = computed(() => list.value && getState(list.value.state))

function getUserId(pk: number): string | undefined {
  return getUser(pk)?.userid || undefined
}

const groups = computed<SpeakerGroup[]>(() => {
  if (!list.value || !system.value || !queue.value || !speakerGroups.value)
    return []
  if (speaking.value) {
    return [
      {
        active: true,
        queue: [speaking.value.user]
      },
      ...speakerGroups.value
    ]
  }
  return speakerGroups.value
})
</script>

<template>
  <div v-if="list">
    <h1 class="text-center">
      {{ list.title }}
    </h1>
    <p class="text-center mb-4" v-if="listState">
      <v-icon :icon="listState.icon" :color="listState.color" />
      {{ listState.getName(t) }}
    </p>
    <p v-if="!queue?.length" class="text-secondary text-center">
      {{ t('speaker.queueEmpty') }}
    </p>
    <v-list bg-color="background">
      <v-slide-x-transition group>
        <template v-for="{ active, title, queue } in groups" :key="title">
          <div
            v-if="!active && queue.length"
            :key="title"
            class="mt-6 mb-2"
            style="z-index: 0"
          >
            <v-divider />
            <div class="overflow-visible mt-n3">
              <span v-if="title" class="bg-background text-secondary pr-2">
                {{ title }}
              </span>
            </div>
          </div>
          <v-list-item
            v-for="pk in queue"
            :key="pk"
            color="primary"
            :active="active"
            style="z-index: 1"
          >
            <template #prepend>
              <UserAvatar :pk="pk" />
            </template>
            <v-list-item-title>
              <User :pk="pk" />
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ getUserId(pk) }}
            </v-list-item-subtitle>
          </v-list-item>
        </template>
      </v-slide-x-transition>
    </v-list>
  </div>
  <h1 v-else class="text-center">
    <em>
      {{ t('speaker.noActiveList') }}
    </em>
  </h1>
</template>
