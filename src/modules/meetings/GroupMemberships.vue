<template>
  <div>
    <v-table v-if="members.length" class="mb-2">
      <thead>
        <tr>
          <th>
            {{ t('name') }}
          </th>
          <th v-if="groupRoles.length">
            {{ t('meeting.groups.role') }}
          </th>
          <th v-if="componentActive">
            {{ t('activeUsers.active') }}
          </th>
          <th v-if="displayGroupVotes">
            {{ t('meeting.groups.votes') }}
          </th>
          <th>
            {{ t('electoralRegister.inCurrent') }}
          </th>
          <th v-if="editable"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="{ currentWeight, isActive, pk, role, user, votes } in annotatedMembers" :key="pk">
          <td>
            {{ user?.full_name }}
            <small v-if="user?.userid" class="text-secondary">({{ user.userid }})</small>
          </td>
          <td v-if="groupRoles.length">
            <v-menu v-if="editable">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  append-icon="mdi-chevron-down"
                  color="secondary"
                  size="small"
                >
                  {{ getRoleTitle(role) }}
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  v-for="grole in groupRoles" :key="grole.role_id"
                  :active="grole.pk === role"
                  :disabled="grole.pk === role"
                  link
                  :title="grole.title"
                  @click="setRole(grole.pk, pk)"
                />
                <v-list-item
                  :active="!role"
                  :disabled="!role"
                  link
                  title="---"
                  @click="setRole(null, pk)"
                />
              </v-list>
            </v-menu>
            <span v-else>
              {{ getRoleTitle(role) }}
            </span>
          </td>
          <td v-if="componentActive">
            <v-icon v-if="isActive" icon="mdi-check" color="success" />
          </td>
          <td v-if="displayGroupVotes">
            {{ votes }}
          </td>
          <td>
            <span v-if="erMethodWeighted">
              {{ currentWeight }}
            </span>
            <v-icon v-else-if="currentWeight" icon="mdi-check" color="success "/>
          </td>
          <td v-if="editable">
            <QueryDialog @confirmed="removeMember(pk)">
              <template #activator="{ props }">
                <v-btn
                  v-if="editable"
                  v-bind="props"
                  color="warning"
                  icon="mdi-close"
                  size="x-small"
                  variant="tonal"
                />
              </template>
              <i18n-t keypath="meeting.groups.removeUserConfirm">
                <template #user>
                  <strong>
                    {{ user?.full_name }}
                  </strong>
                </template>
              </i18n-t>
            </QueryDialog>
          </td>
        </tr>
      </tbody>
    </v-table>
    <UserSearch
      v-if="editable"
      :filter="filterUser"
      :params="{ meeting: meetingId }"
      immediate
      @submit="addUser"
    />
    <v-alert v-if="editable && !members.length" type="info" :text="t('meeting.groups.addMemberEmptyHelp')" class="mt-4" />
  </div>
</template>

<script lang="ts" setup>
import { computed, PropType } from 'vue'
import { useI18n } from 'vue-i18n'

import UserSearch from '@/components/UserSearch.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import useUserDetails from '../organisations/useUserDetails'
import type { User } from '../organisations/types'

import useMeeting from './useMeeting'
import useMeetingGroups from './useMeetingGroups'
import { groupMembershipType } from './contentTypes'
import type { GroupMembership } from './types'
import useActive from '../active/useActive'
import useElectoralRegisters from './electoralRegisters/useElectoralRegisters'

const { t } = useI18n()

const props = defineProps({
  editable: Boolean,
  group: {
    type: Number,
    required: true
  },
  members: {
    type: Array as PropType<GroupMembership[]>,
    required: true
  }
})

const { getUser } = useUserDetails()
const { meeting, meetingId } = useMeeting()
const { groupRoles } = useMeetingGroups(meetingId)
const { activeUserIds, componentActive } = useActive(meetingId)
const { erMethodWeighted, getWeightInCurrent } = useElectoralRegisters(meetingId)

const annotatedMembers = computed(() => {
  return props.members.map(m => {
    return {
      ...m,
      isActive: activeUserIds.value.includes(m.user),
      user: getUser(m.user),
      currentWeight: getWeightInCurrent(m.user)
    }
  })
})

const displayGroupVotes = computed(() => erMethodWeighted.value && !!meeting.value?.dialect?.group_votes_active)

/**
 * Used as filter function for UserSearch
 */
function filterUser (user: User) {
  return !props.members.find(m => m.user === user.pk)
}

function addUser (user: number) {
  groupMembershipType.api.add({
    meeting_group: props.group,
    user
  })
}

function getRoleTitle (role: number | null) {
  const _role = groupRoles.value.find(r => r.pk === role)
  return _role
    ? _role.title
    : '---'
}

function removeMember (pk: number) {
  groupMembershipType.api.delete(pk)
}

/**
 * Set role on users existing group membership
 * @param user User primary key
 * @param pk Primary key of membership object
 */
function setRole (role: number | null, pk: number) {
  groupMembershipType.api.patch(pk, { role })
}
</script>
