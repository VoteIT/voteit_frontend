<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Dropdown from '@/components/Dropdown.vue'
import DropdownMenu from '@/components/DropdownMenu.vue'
import SpeakerList from '../speakerLists/SpeakerList.vue'
import useSpeakerLists from '../speakerLists/useSpeakerLists'
import useMeeting from '../meetings/useMeeting'
import useRooms from '../rooms/useRooms'

const props = defineProps<{
  agendaId: number
}>()

const { t } = useI18n()
const { meetingId, getMeetingRoute } = useMeeting()
const { activeSpeakerSystems, managingSpeakerSystems } = useRooms(meetingId)

const { getAgendaSpeakerLists } = useSpeakerLists()

const speakerLists = computed(() =>
  getAgendaSpeakerLists(props.agendaId, (list) =>
    activeSpeakerSystems.value.some(
      (system) => system.pk === list.speaker_system
    )
  ).map((list) => ({
    ...list,
    // Annotate using room id
    room: activeSpeakerSystems.value.find(
      (sls) => sls.pk === list.speaker_system
    )?.room!
  }))
)

const manageSpeakerListsMenu = computed(() => {
  return managingSpeakerSystems.value.map((system) => ({
    title: t('speaker.manageSystem', { ...system.room }),
    prependIcon: 'mdi-bullhorn',
    to: getMeetingRoute('Plenary', {
      roomId: system.room.pk,
      tab: 'discussion',
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
