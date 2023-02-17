<template>
  <v-tooltip :text="tooltip" location="bottom start">
    <template #activator="{ props }">
      <span :class="{ 'text-warning': !allAssigned }" v-bind="props">
        {{ potentialVotes }}/{{ group.votes }}
      </span>
    </template>
  </v-tooltip>
</template>

<script lang="ts" setup>
import { computed, PropType } from 'vue'

import useActive from '@/modules/active/useActive'
import { GroupMembership, MeetingGroup } from '../types'
import useMeeting from '../useMeeting'

import { isRoleMembership } from './types'

const props = defineProps({
  group: {
    type: Object as PropType<MeetingGroup & { memberships: GroupMembership[] }>,
    required: true
  }
})

const { meetingId } = useMeeting()
const { activeUserIds } = useActive(meetingId)

const roleMemberships = computed(() => props.group.memberships.filter(isRoleMembership))
const activeVoters = computed(() => roleMemberships.value.filter(m => activeUserIds.value.includes(m.user)))
const potentialVotes = computed(() => Math.min(activeVoters.value.length, props.group.votes || 0))
const allAssigned = computed(() => props.group.votes === potentialVotes.value)

const tooltip = computed(() => {
  return allAssigned.value
    ? 'Potentiella röster baseras på aktiva användare med en roll i gruppen.'
    : 'Denna grupp kan inte använda alla sina röster. Det kan bero på att det inte finns tillräckligt många medlemmar med rösträtt, eller att gruppens medlemmar inte är aktiva i mötet.'
})
</script>
