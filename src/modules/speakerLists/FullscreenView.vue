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
            <template v-for="group, i in groups" :key="i">
              <div v-if="!group.active && group.speakers.length" :key="group.title" class="mt-6 mb-2" style="z-index: 0;">
                <v-divider />
                <div class="overflow-visible mt-n3">
                  <span v-if="group.title" class="bg-background text-secondary pr-2">
                    {{ group.title }}
                  </span>
                </div>
              </div>
              <v-list-item v-for="pk in group.speakers" :key="pk" active-color="primary" :active="group.active" style="z-index: 1;">
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

// import UserList from '@/components/UserList.vue'
import useMeetingChannel from '../meetings/useMeetingChannel'

import { speakerListType } from './contentTypes'
import useSpeakerSystem from './useSpeakerSystem'

type SpeakerGroup = ({ title: string } | { active?: true }) & { speakers: number[] }

export default defineComponent({
  components: {
    // UserList
  },
  setup () {
    const { t } = useI18n()
    const route = useRoute()
    const { getState } = speakerListType.useWorkflows()
    useMeetingChannel()
    const { getUser } = useMeeting()

    const { currentActiveList, speakerSystem, currentSpeakerQueue, currentlySpeaking } = useSpeakerSystem(computed(() => Number(route.params.system)))

    const listState = computed(() => currentActiveList.value && getState(currentActiveList.value.state))

    function getUserId (pk: number): string | undefined {
      return getUser(pk)?.userid || undefined
    }

    const groups = computed<SpeakerGroup[]>(() => {
      if (!currentActiveList.value || !speakerSystem.value || !currentSpeakerQueue.value) return []
      const grps: SpeakerGroup[] = [{
        active: true,
        speakers: currentlySpeaking.value ? [currentlySpeaking.value.userid] : []
      }]
      if (speakerSystem.value.safe_positions) {
        grps.push({
          title: t('speaker.lockedPositions'),
          speakers: currentSpeakerQueue.value.slice(0, speakerSystem.value.safe_positions)
        })
      }
      grps.push({
        title: t('speaker.queue'),
        speakers: currentSpeakerQueue.value.slice(speakerSystem.value.safe_positions)
      })
      return grps
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
