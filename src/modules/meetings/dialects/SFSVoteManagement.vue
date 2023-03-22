<template>
  <div v-if="groupVotes || assignedVotes">
    <span :class="{ 'text-warning': !allAssigned }">{{ assignedVotes }}/{{ groupVotes }}</span>
    <DefaultDialog v-if="canAssignVotes" v-model="editing">
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
      <v-alert v-if="errorMessage" :text="errorMessage" type="error" class="mb-2" />
      <div class="text-right">
        <v-btn variant="text" :disabled="working" @click="editing = false">
          {{ t('cancel') }}
        </v-btn>
        <v-btn color="primary" :loading="working" :disabled="!!editUnassignedVotes" @click="saveUserVotes">
          {{ t('save') }}
        </v-btn>
      </div>
    </DefaultDialog>
  </div>
</template>

<script lang="ts" setup>
import { sum } from 'itertools'
import { computed, PropType, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { socket } from '@/utils/Socket'
import UserList from '@/components/UserList.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'
import { user } from '@/composables/useAuthentication'
import useErrorHandler from '@/composables/useErrorHandler'
import useRules from '@/composables/useRules'

import { GroupMembership, MeetingGroup } from '../types'
import useMeetingGroups from '../useMeetingGroups'
import useMeeting from '../useMeeting'
import { isFinishedMeeting } from '../rules'

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
const { errorMessage, clearErrors, handleSocketError } = useErrorHandler()

interface RoleMembership extends GroupMembership { role: number }
function isRoleMembership (membership: GroupMembership): membership is RoleMembership {
  return !!membership.role
}
const roleMemberships = computed(() => props.group.memberships.filter(isRoleMembership))

const groupVotes = computed(() => props.group.votes || 0)
const assignedVotes = computed(() => {
  return roleMemberships.value
    .reduce((acc, member) => acc + (member.votes ?? 0), 0)
})

const allAssigned = computed(() => props.group.votes === assignedVotes.value)
const leaderRoleId = computed(() => groupRoles.value.find(g => g.role_id === 'leader')?.pk)

/**
 * Meeting is in active state (upcoming, ongoing), and user is moderator or group manager,
 */
const canAssignVotes = computed(() => {
  if (!user.value || !props.group.votes || !roleMemberships.value.length) return false
  return (
    !isFinishedMeeting(meetingId.value) &&
    (
      !isModerator.value ||
      props.group.memberships.some(member => member.user === user.value?.pk && member.role === leaderRoleId.value)
    )
  )
})

// For management modal
const editing = ref(false)
const editUserIds = computed(() => roleMemberships.value.map(member => member.user))
const editUserVotes = reactive(new Map(roleMemberships.value.map(({ user, votes }) => [user, votes || 0])))
const editUnassignedVotes = computed(() => groupVotes.value - sum(editUserVotes.values()))

// Make sure we have the latest values when editing
watch(editing, value => {
  if (!value) return clearErrors()
  for (const { user, votes } of roleMemberships.value) {
    editUserVotes.set(user, votes ?? 0)
  }
  // Remove any users with no current roles
  for (const { user } of props.group.memberships.filter(({ role }) => !role)) {
    editUserVotes.delete(user)
  }
})

const working = ref(false)
async function saveUserVotes () {
  if (editUnassignedVotes.value) throw new Error('Cannot save user votes, becuase not all votes assigned')
  clearErrors()
  working.value = true
  try {
    await socket.call('sfs.set_delegation_voters', {
      meeting_group: props.group.pk,
      weights: [...editUserVotes.entries()]
        .map(([user, weight]) => ({ user, weight }))
        .filter(({ weight }) => weight)
    })
    editing.value = false
  } catch (e) {
    handleSocketError(e)
  }
  working.value = false
}
</script>
