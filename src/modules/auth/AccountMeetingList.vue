<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import { meetingType } from '@/modules/meetings/contentTypes'
import { MeetingState } from '@/modules/meetings/types'

import { AccountMeeting } from './types'

const props = defineProps<{
  meetings: readonly AccountMeeting[]
  /** All the account's meetings, when only some were sent */
  total?: number
}>()

const { t } = useI18n()

function getMeetingState(state: MeetingState) {
  const meetingState = meetingType.sm.getState(state)
  return {
    icon: meetingState.icon,
    title: meetingState.translate?.(t) ?? state
  }
}
</script>

<template>
  <p class="mt-2 text-medium-emphasis">
    {{ $t('auth.chooseAccount.meetings') }}
  </p>
  <ul class="ml-4">
    <li v-for="meeting in meetings" :key="meeting.pk">
      {{ meeting.title }}
      <span v-if="meeting.state" class="text-medium-emphasis">
        <v-icon :icon="getMeetingState(meeting.state).icon" size="small" />
        {{ getMeetingState(meeting.state).title }}
      </span>
    </li>
  </ul>
  <p
    v-if="props.total && props.total > meetings.length"
    class="ml-4 text-medium-emphasis"
  >
    {{ $t('auth.chooseAccount.moreMeetings', props.total - meetings.length) }}
  </p>
</template>
