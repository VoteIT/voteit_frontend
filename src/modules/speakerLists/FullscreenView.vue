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
            <v-list-item v-if="speaking" active class="bg-primary">
              <v-list-item-avatar class="mr-2">
                <UserAvatar :pk="speaking.userid" />
              </v-list-item-avatar>
              <v-list-item-title>
                <User :pk="speaking.userid" />
              </v-list-item-title>
            </v-list-item>
            <v-list-item v-for="(pk, i) in queue" :key="pk" border class="mt-1">
              <v-badge :model-value="i < system.safe_positions" icon="mdi-lock" rounded="circle" color="transparent" offset-x="-2px" location="top-left">
                <v-list-item-avatar class="mr-2">
                  <UserAvatar :pk="pk" />
                </v-list-item-avatar>
              </v-badge>
              <v-list-item-title>
                <User :pk="pk" />
              </v-list-item-title>
            </v-list-item>
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

import useMeetingChannel from '../meetings/useMeetingChannel'

import { speakerListType } from './contentTypes'
import useSpeakerSystem from './useSpeakerSystem'

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const route = useRoute()
    const { getState } = speakerListType.useWorkflows()
    useMeetingChannel(true)

    const { currentActiveList, speakerSystem, currentSpeakerQueue, currentlySpeaking } = useSpeakerSystem(computed(() => Number(route.params.system)))

    const listState = computed(() => currentActiveList.value && getState(currentActiveList.value.state))
    return {
      t,
      list: currentActiveList,
      listState,
      system: speakerSystem,
      queue: currentSpeakerQueue,
      speaking: currentlySpeaking
    }
  }
})
</script>
