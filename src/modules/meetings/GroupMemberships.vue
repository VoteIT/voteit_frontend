<template>
  <div>
    <v-list v-if="members.length" class="mb-2">
      <v-list-item
        v-for="{ pk, role, user } in annotatedMembers" :key="pk"
        :title="user?.full_name"
        :subtitle="user?.userid || undefined"
      >
        <template #append>
          <v-menu
            v-if="editable && groupRoles.length"
          >
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                append-icon="mdi-chevron-down"
                class="mr-1"
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
          <v-btn
            v-else-if="groupRoles.length"
            class="mr-1"
            color="secondary"
            size="small"
            variant="tonal"
          >
            {{ getRoleTitle(role) }}
          </v-btn>
          <QueryDialog
            v-if="editable"
            @confirmed="removeMember(pk)"
          >
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
        </template>
      </v-list-item>
    </v-list>
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
const { meetingId } = useMeeting()
const { groupRoles } = useMeetingGroups(meetingId)

const annotatedMembers = computed(() => {
  return props.members.map(m => {
    return {
      ...m,
      user: getUser(m.user)
    }
  })
})

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
