<template>
  <v-app-bar app flat>
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
        {{ speakerSystem.title }}
      </v-app-bar-title>
      <Menu position="bottom" :items="systemsMenu" icon="mdi-chevron-down" />
    </template>
  </v-app-bar>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { MenuItemTo } from '@/utils/types'
import useMeeting from '../meetings/useMeeting'

import useSpeakerLists from './useSpeakerLists'
import useSpeakerSystem from './useSpeakerSystem'

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const route = useRoute()

    const { getSystems } = useSpeakerLists()
    const { meeting, meetingId, meetingPath } = useMeeting()
    const { speakerSystem } = useSpeakerSystem(computed(() => Number(route.params.system)))

    const systems = computed(() => getSystems(meetingId.value))
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
      meeting,
      meetingPath,
      speakerSystem,
      systemsMenu
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
