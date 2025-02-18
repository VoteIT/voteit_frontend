<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Dropdown from '@/components/Dropdown.vue'
import DropdownMenu from '@/components/DropdownMenu.vue'
import useMeetingId from '../meetings/useMeetingId'
import useRooms, { meetingRoomStore } from '../rooms/useRooms'
import useRoom from '../rooms/useRoom'
import SpeakerList from '../speakerLists/SpeakerList.vue'
import { getSpeakerLists } from '../speakerLists/useSpeakerLists'

const props = defineProps<{
  agendaId: number
}>()

const { t } = useI18n()
const meetingId = useMeetingId()
const { activeSpeakerSystems, managingSpeakerSystems } = useRooms(meetingId)
const { getRoomRoute } = useRoom()

const speakerLists = computed(() =>
  getSpeakerLists(
    (list) =>
      list.agenda_item === props.agendaId &&
      activeSpeakerSystems.value.some(
        (system) => system.pk === list.speaker_system
      )
  ).map((list) => ({
    ...list,
    // Annotate with room information
    room: meetingRoomStore.get(
      activeSpeakerSystems.value.find((sls) => sls.pk === list.speaker_system)
        ?.room!
    )!
  }))
)

const manageSpeakerListsMenu = computed(() => {
  return managingSpeakerSystems.value.map((system) => {
    const room = meetingRoomStore.get(system.room)
    return {
      title: t('speaker.manageSystem', { ...room }),
      prependIcon: 'mdi-bullhorn',
      to: room
        ? getRoomRoute('room:broadcast', {
            id: room.meeting,
            roomId: room.pk,
            aid: props.agendaId,
            tab: 'discussion'
          })
        : { hash: '' }
    }
  })
})
</script>

<template>
  <Dropdown
    v-if="speakerLists.length || manageSpeakerListsMenu.length"
    :title="$t('speaker.lists', speakerLists.length)"
    modelValue
  >
    <template #actions v-if="manageSpeakerListsMenu.length">
      <v-tooltip :text="$t('speaker.manageLists')">
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
    <SpeakerList
      v-for="list in speakerLists"
      :key="list.pk"
      :list="list"
      class="mb-2"
    />
  </Dropdown>
</template>
