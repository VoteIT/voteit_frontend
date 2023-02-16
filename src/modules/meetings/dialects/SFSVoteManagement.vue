<template>
  <div v-if="groupVotes || assignedVotes">
    <span :class="{ 'text-warning': !allAssigned }">{{ assignedVotes }}/{{ groupVotes }}</span>
    <DefaultDialog v-if="canAssignVotes">
      <template #activator="{ props }">
        <v-btn size="small" color="accent" class="ml-2" v-bind="props">
          Fördela röster
        </v-btn>
      </template>
      <UserList :user-ids="editUserIds">
        <template #appendItem="{ user }">
          <v-text-field
            variant="outlined"
            density="compact"
            @keydown.stop
            type="number"
            :min="0"
            :max="(editUserVotes.get(user) ?? 0) + editUnassignedVotes"
            :model-value="editUserVotes.get(user)"
            @update:model-value="editUserVotes.set(user, Number($event))"
            :rules="[rules.max((editUserVotes.get(user) ?? 0) + editUnassignedVotes)]"
          />
        </template>
      </UserList>
      <v-alert class="mb-2" :color="editUnassignedVotes ? 'secondary' : undefined">
        {{ editUnassignedVotes }} röster kvar att fördela
      </v-alert>
      <div class="text-right">
        <v-btn color="primary" :disabled="!!editUnassignedVotes">
          {{ t('save') }}
        </v-btn>
      </div>
    </DefaultDialog>
  </div>
</template>

<script lang="ts" setup>
import { sum } from 'itertools'
import { computed, PropType, reactive } from 'vue'

import DefaultDialog from '@/components/DefaultDialog.vue'
import { user } from '@/composables/useAuthentication'
import { GroupMembership, MeetingGroup } from '../types'
import useMeetingGroups from '../useMeetingGroups'
import useMeeting from '../useMeeting'
import UserList from '@/components/UserList.vue'
import useRules from '@/composables/useRules'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  group: {
    type: Object as PropType<MeetingGroup & { memberships: GroupMembership[] }>,
    required: true
  }
})

const { t } = useI18n()

const { isModerator, meetingId } = useMeeting()
const { groupRoles } = useMeetingGroups(meetingId)
const rules = useRules(t)

const groupVotes = computed(() => props.group.votes || 0)
const assignedVotes = computed(() => {
  return props.group.memberships
    .reduce((acc, member) => acc + (member.votes ?? 0), 0)
})

const allAssigned = computed(() => props.group.votes === assignedVotes.value)

const leaderRoleId = computed(() => groupRoles.value.find(g => g.role_id === 'leader')?.pk)

const canAssignVotes = computed(() => {
  return (
    isModerator ||
    props.group.memberships.some(member => member.user === user.value?.pk && member.role === leaderRoleId.value)
  )
})

// For management modal
const editUserIds = computed(() => props.group.memberships.filter(({ role }) => !!role).map(member => member.user))
const editUserVotes = reactive(new Map(props.group.memberships.map(({ user, votes }) => [user, votes || 0])))
const editUnassignedVotes = computed(() => groupVotes.value - sum(editUserVotes.values()))
</script>
