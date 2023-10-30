<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useIdle } from '@vueuse/core'

import { MenuItemTo } from '@/utils/types'
import DropdownMenu from '@/components/DropdownMenu.vue'
import useAgendaItem from '../agendas/useAgendaItem'
import useMeeting from '../meetings/useMeeting'

import useSpeakerSystem from './useSpeakerSystem'
import useSpeakerSystems from './useSpeakerSystems'

const { t } = useI18n()
const { idle } = useIdle(3000)
const route = useRoute()

const { meeting, meetingId, meetingRoute } = useMeeting()
const { activeSpeakerSystems } = useSpeakerSystems(meetingId)
const { speakerSystem, systemActiveList } = useSpeakerSystem(
  computed(() => Number(route.params.system))
)
const { agendaItemRoute } = useAgendaItem(
  computed(() => systemActiveList.value?.agenda_item)
)

const systemsMenu = computed<MenuItemTo[] | undefined>(() => {
  if (activeSpeakerSystems.value.length <= 1) return
  return activeSpeakerSystems.value
    .filter((system) => system.pk !== speakerSystem.value?.pk)
    .map((system) => {
      return {
        title: system.title,
        to: `/speakers/${meetingId.value}/${system.pk}`
      }
    })
})

const nav = computed(() => {
  if (agendaItemRoute.value) {
    return {
      icon: 'mdi-format-list-bulleted',
      to: agendaItemRoute.value,
      title: t('speaker.toAgendaItem')
    }
  }
  return {
    icon: 'mdi-home-outline',
    to: meetingRoute.value,
    title: t('speaker.toMeeting')
  }
})
</script>

<template>
  <v-app-bar flat color="app-bar">
    <router-link :to="meetingRoute" :title="t('home.home')" class="mr-4">
      <img src="@/assets/voteit-logo.svg" alt="VoteIT" />
    </router-link>
    <v-app-bar-title v-if="meeting">
      <router-link :to="meetingRoute" class="text-white text-decoration-none">
        {{ meeting.title }}
        <small v-if="speakerSystem"> ({{ speakerSystem.title }}) </small>
      </router-link>
      <v-fade-transition>
        <v-btn
          v-show="!idle"
          size="small"
          variant="tonal"
          class="ml-4 mt-n1"
          :to="nav.to"
          :prepend-icon="nav.icon"
        >
          {{ nav.title }}
        </v-btn>
      </v-fade-transition>
    </v-app-bar-title>
    <DropdownMenu
      v-if="systemsMenu"
      position="bottom"
      :items="systemsMenu"
      icon="mdi-chevron-down"
    />
  </v-app-bar>
</template>
