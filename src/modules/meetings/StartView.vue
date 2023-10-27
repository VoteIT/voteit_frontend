<template>
  <v-row v-if="meeting">
    <v-col v-bind="cols.default">
      <header class="d-flex">
        <div class="flex-grow-1">
          <WorkflowState
            :admin="isModerator"
            :contentType="meetingType"
            :object="meeting"
          />
          <Headline
            v-model="content.title"
            :editing="editing"
            @edit-done="submit()"
          />
        </div>
        <DropdownMenu :items="menuItems" />
      </header>
      <v-alert
        v-if="meeting.state == MeetingState.Deleting"
        :text="t('meeting.markedForDeleteWarn')"
        type="warning"
        class="my-2"
      />
      <Richtext
        v-model="content.body"
        :editing="editing"
        @edit-done="submit()"
        variant="full"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTitle } from '@vueuse/core'

import { MenuItem } from '@/utils/types'
import Headline from '@/components/Headline.vue'
import Richtext from '@/components/Richtext.vue'
import WorkflowState from '@/components/WorkflowState.vue'
import useDefaults from '@/composables/useDefaults'

import useAgenda from '../agendas/useAgenda'
import useRooms from '../rooms/useRooms'
import useSpeakerSystems from '../speakerLists/useSpeakerSystems'

import { meetingType } from './contentTypes'
import useMeeting from './useMeeting'
import { MeetingState } from './types'

const { t } = useI18n()
const { cols } = useDefaults()

const editing = ref(false)
const { meeting, meetingId, canChange, isModerator } = useMeeting()
const { agenda } = useAgenda(meetingId)
const { activeSpeakerSystems } = useSpeakerSystems(meetingId)
const { meetingRooms } = useRooms(meetingId)

useTitle(computed(() => `${meeting.value?.title} | VoteIT`))

const content = reactive({
  title: meeting.value?.title ?? '',
  body: meeting.value?.body ?? ''
})
watch(meeting, (value) => {
  if (editing.value) return
  content.title = value?.title ?? ''
  content.body = value?.body ?? ''
})

function getRoomMenu(roomId: number, title: string) {
  return {
    title,
    prependIcon: 'mdi-gavel',
    to: {
      name: 'Plenary',
      params: {
        id: meetingId.value,
        aid: agenda.value[0].pk,
        roomId
      }
    }
  }
}

function* iterMenu() {
  if (canChange.value)
    yield {
      title: t('edit'),
      prependIcon: 'mdi-pencil',
      onClick: async () => {
        editing.value = true
      }
    }
  const hasPlenary =
    canChange.value && !!meetingRooms.value.length && !!agenda.value.length
  if (activeSpeakerSystems.value.length || hasPlenary) yield '---'
  if (activeSpeakerSystems.value.length) {
    for (const system of activeSpeakerSystems.value) {
      yield {
        title: t('speaker.fullscreenSystem', { ...system }),
        prependIcon: 'mdi-projector-screen-outline',
        to: `/speakers/${meetingId.value}/${system.pk}`
      }
    }
  }
  if (!hasPlenary) return
  if (meetingRooms.value.length === 1)
    yield getRoomMenu(meetingRooms.value[0].pk, t('plenary.view'))
  else
    for (const room of meetingRooms.value) {
      yield getRoomMenu(room.pk, `${t('plenary.view')} (${room.title})`)
    }
}

const menuItems = computed<MenuItem[]>(() => [...iterMenu()])

function submit() {
  editing.value = false
  if (
    content.title === meeting.value?.title &&
    content.body === meeting.value?.body
  )
    return
  meetingType.api.patch(meetingId.value, { ...content })
}
</script>
