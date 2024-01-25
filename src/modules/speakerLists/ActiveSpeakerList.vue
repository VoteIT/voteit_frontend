<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import User from '@/components/User.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import useChannel from '@/composables/useChannel'
import useLoader from '@/composables/useLoader'
import useUserDetails from '../organisations/useUserDetails'

import { speakerListType } from './contentTypes'
import { SpeakerGroup } from './types'
import useSpeakerList from './useSpeakerList'
import useSpeakerSystem from './useSpeakerSystem'
import Moment from '@/components/Moment.vue'

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
        title: t('speaker.currentlySpeaking'),
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
    <h2 class="mb-2">
      <small>{{ t('speaker.list') }}</small
      ><br />
      {{ list.title }}
    </h2>
    <p class="mb-1" v-if="listState">- {{ listState.getName(t) }}</p>
    <p v-if="!speaking && !queue?.length" class="text-secondary">
      {{ t('speaker.queueEmpty') }}
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
          <v-list-item
            v-for="pk in queue"
            :key="pk"
            color="primary"
            style="z-index: 1"
            :class="{ active }"
            rounded
          >
            <template #prepend>
              <UserAvatar :pk="pk" />
            </template>
            <template v-if="system?.show_time && active && speaking" #append>
              <span class="timer px-4 text-primary">
                <Moment in-seconds ordinary :date="speaking.started" />
              </span>
            </template>
            <v-list-item-title>
              <User :pk="pk" />
              <v-icon
                v-if="active"
                icon="mdi-account-voice"
                size="x-small"
                class="ml-1"
              />
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ getUserId(pk) }}
            </v-list-item-subtitle>
          </v-list-item>
        </template>
      </v-slide-x-transition>
    </v-list>
  </div>
  <h2 v-else>
    <small>{{ t('speaker.list') }}</small
    ><br />
    <em>
      {{ t('speaker.noActiveList') }}
    </em>
  </h2>
</template>

<style scoped lang="sass">
.active
  border: 2px solid rgba(var(--v-theme-primary), .5)

.timer
  background-color: rgba(var(--v-theme-primary), .08)
  border-radius: 3px

h2
  line-height: 1.2
  small
    font-size: .9rem !important
</style>
