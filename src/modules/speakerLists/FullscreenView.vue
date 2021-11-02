<template>
  <teleport to=".v-application__wrap">
    <v-app-bar>
      <v-app-bar-title>
        <router-link to="/" :title="t('home.home')" class="mr-4">
          <img :src="require('@/assets/voteit-logo.svg').default" alt="VoteIT" />
        </router-link>
      </v-app-bar-title>
      <v-app-bar-title v-if="meeting">
        <router-link :to="meetingPath">
          {{ meeting.title }}
        </router-link>
      </v-app-bar-title>
      <template v-if="systemsMenu">
        <v-spacer />
        <v-app-bar-title>
          {{ system.title }}
        </v-app-bar-title>
        <Menu position="bottom" :items="systemsMenu" icon="mdi-chevron-down" />
      </template>
    </v-app-bar>
  </teleport>
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
        </v-list>
      </template>
      <h1 v-else class="text-center"><em>
        {{ t('speaker.noActiveList') }}
      </em></h1>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { MenuItemTo } from '@/utils/types'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import useMeeting from '../meetings/useMeeting'

import useMeetingChannel from '../meetings/useMeetingChannel'
import { speakerListType } from './contentTypes'
import useSpeakerLists from './useSpeakerLists'
import useSpeakerSystem from './useSpeakerSystem'

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const route = useRoute()
    const { getState } = speakerListType.useWorkflows()
    useMeetingChannel(true)

    const { getSystems } = useSpeakerLists()
    const { meeting, meetingId, meetingPath } = useMeeting()
    const { currentActiveList, speakerSystem, currentSpeakerQueue, currentlySpeaking } = useSpeakerSystem(computed(() => Number(route.params.system)))

    const systems = computed(() => getSystems(meetingId.value))
    const listState = computed(() => currentActiveList.value && getState(currentActiveList.value.state))
    const systemsMenu = computed<MenuItemTo[] | undefined>(() => {
      if (systems.value.length <= 1) return
      return systems.value.map(system => {
        return {
          title: system.title,
          to: `/speakers/${meetingId.value}/${system.pk}`
        }
      })
    })
    return {
      t,
      list: currentActiveList,
      listState,
      meeting,
      meetingPath,
      system: speakerSystem,
      systemsMenu,
      queue: currentSpeakerQueue,
      speaking: currentlySpeaking
    }
  }
})
</script>

<style lang="sass" scoped>
.v-app-bar
  overflow: visible
  color: rgb(var(--v-theme-on-app-bar))
a
  color: rgb(var(--v-theme-on-app-bar))
  text-decoration: none
</style>
