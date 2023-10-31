<script setup lang="ts">
import { computed } from 'vue'

import SpeakerList from '../speakerLists/SpeakerList.vue'
import useSpeakerLists from '../speakerLists/useSpeakerLists'
import useSpeakerSystems from '../speakerLists/useSpeakerSystems'
import useMeeting from '../meetings/useMeeting'
import { useI18n } from 'vue-i18n'
import Dropdown from '@/components/Dropdown.vue'

const props = defineProps<{
  agendaId: number
}>()

const { t } = useI18n()
const { meetingId, getMeetingRoute } = useMeeting()
const { activeSpeakerSystems, managingSpeakerSystems } =
  useSpeakerSystems(meetingId)

const { getAgendaSpeakerLists } = useSpeakerLists()

const speakerLists = computed(() =>
  getAgendaSpeakerLists(
    props.agendaId,
    (list) =>
      !!activeSpeakerSystems.value.find(
        (system) => system.pk === list.speaker_system
      )
  )
)

const manageSpeakerListsMenu = computed(() => {
  return managingSpeakerSystems.value.map((system) => ({
    title: t('speaker.manageSystem', { ...system }),
    prependIcon: 'mdi-bullhorn',
    to: getMeetingRoute('speakerLists', {
      system: system.pk,
      aid: props.agendaId
    })
  }))
})
</script>

<template>
  <Dropdown
    v-if="speakerLists.length || manageSpeakerListsMenu.length"
    :title="t('speaker.lists', speakerLists.length)"
    modelValue
  >
    <template #actions v-if="manageSpeakerListsMenu.length">
      <v-tooltip :text="t('speaker.manageLists')">
        <template #activator="{ props }">
          <DropdownMenu
            v-if="manageSpeakerListsMenu.length > 1"
            v-bind="props"
            :items="manageSpeakerListsMenu"
            icon="mdi-bullhorn"
            size="small"
          />
          <v-btn
            v-else
            v-bind="props"
            size="small"
            variant="text"
            :to="manageSpeakerListsMenu[0].to"
            icon="mdi-bullhorn"
          />
        </template>
      </v-tooltip>
    </template>
    <SpeakerList v-for="list in speakerLists" :key="list.pk" :list="list" />
  </Dropdown>
</template>
