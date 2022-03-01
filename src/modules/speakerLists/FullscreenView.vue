<template>
  <v-row>
    <v-col sm="10" offset-sm="1" md="8" offset-md="2">
      <template v-if="list">
        <h1 class="text-center">
          {{ list.title }}
        </h1>
        <p class="text-center mb-4">
          <v-icon :icon="listState.icon" :color="listState.color" />
          {{ t(`workflowState.${listState.state}`) }}
        </p>
        <p v-if="!queue.length" class="text-secondary text-center">
          {{ t('speaker.queueEmpty') }}
        </p>
        <v-list>
          <v-slide-x-transition group>
            <template v-for="{ active, title, queue } in groups" :key="title">
              <div v-if="!active && queue.length" :key="title" class="mt-6 mb-2" style="z-index: 0;">
                <v-divider />
                <div class="overflow-visible mt-n3">
                  <span v-if="title" class="bg-background text-secondary pr-2">
                    {{ title }}
                  </span>
                </div>
              </div>
              <v-list-item v-for="pk in queue" :key="pk" active-color="primary" :active="active" style="z-index: 1;">
                <v-list-item-avatar class="mr-2">
                  <UserAvatar :pk="pk" />
                </v-list-item-avatar>
                <div>
                  <v-list-item-title>
                    <User :pk="pk" />
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ getUserId(pk) }}
                  </v-list-item-subtitle>
                </div>
              </v-list-item>
            </template>
          </v-slide-x-transition>
        </v-list>
      </template>
      <h1 v-else class="text-center"><em>
        {{ t('speaker.noActiveList') }}
      </em></h1>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import useMeeting from '../meetings/useMeeting'

import useMeetingChannel from '../meetings/useMeetingChannel'

import { speakerListType } from './contentTypes'
import { SpeakerGroup } from './types'
import useSpeakerList from './useSpeakerList'
import useSpeakerSystem from './useSpeakerSystem'

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const route = useRoute()
    const { getState } = speakerListType.useWorkflows()
    useMeetingChannel()
    const { getUser } = useMeeting()

    const { currentActiveList, currentActiveListId, speakerSystem, currentSpeakerQueue, currentlySpeaking } = useSpeakerSystem(computed(() => Number(route.params.system)))
    const { speakerGroups } = useSpeakerList(currentActiveListId)

    const listState = computed(() => currentActiveList.value && getState(currentActiveList.value.state))

    function getUserId (pk: number): string | undefined {
      return getUser(pk)?.userid || undefined
    }

    const groups = computed<SpeakerGroup[]>(() => {
      if (!currentActiveList.value || !speakerSystem.value || !currentSpeakerQueue.value || !speakerGroups.value) return []
      if (currentlySpeaking.value) {
        return [
          {
            active: true,
            queue: [currentlySpeaking.value.user]
          },
          ...speakerGroups.value
        ]
      }
      return speakerGroups.value
    })

    return {
      t,
      list: currentActiveList,
      listState,
      groups,
      system: speakerSystem,
      queue: currentSpeakerQueue,
      speaking: currentlySpeaking,
      getUserId
    }
  }
})
</script>
