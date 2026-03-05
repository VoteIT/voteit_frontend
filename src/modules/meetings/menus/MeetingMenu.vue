<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import CollapsibleMenu from '@/components/CollapsibleMenu.vue'
import useMeeting from '../useMeeting'
import { meetingNavPlugins } from '../registry'

const { t } = useI18n()
const { canChange, meeting, meetingRoute, getMeetingRoute } = useMeeting()

function* iterMeetingItems() {
  if (!meeting.value) return
  yield* [
    {
      exactActive: true,
      title: t('start'),
      to: meetingRoute.value
    },
    {
      title: t('meeting.participants'),
      to: getMeetingRoute('participants')
    },
    {
      title: t('electoralRegister.plural'),
      to: getMeetingRoute('electoralRegisters')
    },
    {
      title: t('minutes.documents'),
      to: getMeetingRoute('meetingMinutes')
    }
  ]
  if (canChange.value)
    yield {
      icons: ['mdi-cog'],
      title: t('meeting.controlPanel'),
      to: getMeetingRoute('settings')
    }
  for (const plugin of meetingNavPlugins.getActivePlugins(meeting.value))
    yield* plugin.iterItems({ meeting: meeting.value, menu: 'meeting', t })
}

const meetingLinks = computed(() => [...iterMeetingItems()])
</script>

<template>
  <li>
    <CollapsibleMenu
      auto-open
      icon="mdi-home"
      :links="meetingLinks"
      :title="$t('meeting.meeting')"
    />
  </li>
</template>
