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
      <v-fade-transition>
        <v-btn v-show="!idle" size="small" variant="tonal" class="ml-4 mt-n1" :to="nav.to" :prepend-icon="nav.icon">
          {{ nav.title }}
        </v-btn>
      </v-fade-transition>
    </v-app-bar-title>
    <Menu v-if="systemsMenu" position="bottom" :items="systemsMenu" icon="mdi-chevron-down" />
  </v-app-bar>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useIdle } from '@vueuse/core'

import { MenuItemTo } from '@/utils/types'
import useAgendaItem from '../agendas/useAgendaItem'
import useMeeting from '../meetings/useMeeting'

import useSpeakerSystem from './useSpeakerSystem'
import useSpeakerSystems from './useSpeakerSystems'

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const { idle } = useIdle(3000)
    const route = useRoute()

    const { meeting, meetingId, meetingPath } = useMeeting()
    const { activeSpeakerSystems } = useSpeakerSystems(meetingId)
    const { speakerSystem, systemActiveList } = useSpeakerSystem(computed(() => Number(route.params.system)))
    const { agendaItemPath } = useAgendaItem(computed(() => systemActiveList.value?.agenda_item))

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
      idle,
      meeting,
      meetingPath,
      nav: computed(() => {
        if (agendaItemPath.value) {
          return {
            icon: 'mdi-format-list-bulleted',
            to: agendaItemPath.value,
            title: t('speaker.toAgendaItem')
          }
        }
        return {
          icon: 'mdi-home-outline',
          to: meetingPath.value,
          title: t('speaker.toMeeting')
        }
      }),
      speakerSystem,
      systemsMenu
    }
  }
})
</script>
