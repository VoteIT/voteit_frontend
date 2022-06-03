<template>
  <v-app-bar app flat>
    <router-link :to="meetingPath" :title="t('home.home')" class="mr-4">
      <img :src="require('@/assets/voteit-logo.svg')" alt="VoteIT" />
    </router-link>
    <v-app-bar-title v-if="meeting">
      <router-link :to="meetingPath">
        {{ meeting.title }}
        <small v-if="speakerSystem">
          ({{ speakerSystem.title }})
        </small>
      </router-link>
    </v-app-bar-title>
    <Menu v-if="systemsMenu" position="bottom" :items="systemsMenu" icon="mdi-chevron-down" />
  </v-app-bar>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { MenuItemTo } from '@/utils/types'
import useMeeting from '../meetings/useMeeting'

import useSpeakerSystem from './useSpeakerSystem'
import useSpeakerSystems from './useSpeakerSystems'

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const route = useRoute()

    const { meeting, meetingId, meetingPath } = useMeeting()
    const { activeSpeakerSystems } = useSpeakerSystems(meetingId)
    const { speakerSystem } = useSpeakerSystem(computed(() => Number(route.params.system)))

    const systemsMenu = computed<MenuItemTo[] | undefined>(() => {
      if (activeSpeakerSystems.value.length <= 1) return
      return activeSpeakerSystems.value
        .filter(system => system.pk !== speakerSystem.value?.pk)
        .map(system => {
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
