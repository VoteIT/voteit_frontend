<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIdle } from '@vueuse/core'

import useChannel from '@/composables/useChannel'
import useLoader from '@/composables/useLoader'
import Moment from '@/components/Moment.vue'
import useErrorHandler from '@/composables/useErrorHandler'

import { speakerListType } from './contentTypes'
import { SpeakerGroup } from './types'
import useSpeakerList from './useSpeakerList'
import useSpeakerSystem from './useSpeakerSystem'
import SpeakerEntry from './SpeakerEntry.vue'

const props = defineProps<{
  systemId: number
}>()

const { t } = useI18n()
const systemId = computed(() => props.systemId)
useLoader('ActiveSpeakerList', useChannel('sls', systemId).promise)

const { getState } = speakerListType.useWorkflows()
const {
  systemActiveList: list,
  systemActiveListId,
  speakerSystem: system,
  currentSpeakerQueue: queue,
  currentlySpeaking: speaking
} = useSpeakerSystem(systemId)
const { speakerGroups, canEnterList, canLeaveList, enterList, leaveList } =
  useSpeakerList(systemActiveListId)
const { idle } = useIdle(5000)
const { handleSocketError } = useErrorHandler({ target: 'dialog' })

const listState = computed(() => list.value && getState(list.value.state))

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

const enterLeaveWorking = ref(false)
function enterLeaveAction(fn: () => Promise<any>) {
  return async () => {
    enterLeaveWorking.value = true
    try {
      await fn()
    } catch (e) {
      handleSocketError(e)
    }
    enterLeaveWorking.value = false
  }
}

// eslint-disable-next-line vue/return-in-computed-property
const enterLeaveButton = computed(() => {
  if (canEnterList.value)
    return {
      text: t('speaker.enterList'),
      color: 'primary',
      disabled: enterLeaveWorking.value,
      prependIcon: 'mdi-account-voice',
      onClick: enterLeaveAction(enterList)
    }
  if (canLeaveList.value)
    return {
      text: t('speaker.leaveList'),
      color: 'warning',
      disabled: enterLeaveWorking.value,
      prependIcon: 'mdi-account-voice-off',
      onClick: enterLeaveAction(leaveList)
    }
})
</script>

<template>
  <div v-if="list">
    <div class="d-sm-flex">
      <div class="flex-grow-1">
        <h2 class="mb-2 flex-grow-1">
          <small>{{ t('speaker.list') }}</small
          ><br />
          {{ list.title }}
        </h2>
        <p class="mb-1" v-if="listState">- {{ listState.getName(t) }}</p>
      </div>
      <v-fade-transition>
        <v-btn v-if="enterLeaveButton && !idle" v-bind="enterLeaveButton" />
      </v-fade-transition>
    </div>
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
          <SpeakerEntry
            v-for="user in queue"
            :key="user"
            :active="active"
            :user="user"
          >
            <template v-if="system?.show_time && active && speaking" #append>
              <span class="timer px-4 text-primary">
                <Moment in-seconds ordinary :date="speaking.started" />
              </span>
            </template>
          </SpeakerEntry>
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
.timer
  background-color: rgba(var(--v-theme-primary), .08)
  border-radius: 3px

h2
  line-height: 1.2
  small
    font-size: .9rem !important
</style>
