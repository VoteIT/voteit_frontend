<template>
  <AppBar hasNavDrawer :title="meeting?.title" />
  <UserMenu>
    <template #prependProfile v-if="roleList.length || userGroups.length">
      <template v-if="roleList.length">
        <v-list-subheader>
          {{ t('meeting.yourRoles') }}
        </v-list-subheader>
        <v-list-item
          v-for="props in roleList"
          :key="props.title"
          v-bind="props"
          density="compact"
        />
        <DefaultDialog
          v-if="isActualModerator"
          :title="t('admin.testMode')"
          v-model="testDialogOpen"
        >
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              density="compact"
              prepend-icon="mdi-account-hard-hat"
              :title="t('admin.testMode')"
            />
          </template>
          <v-alert
            type="info"
            :text="t('admin.testModeDescription')"
            class="mb-3"
          />
          <JsonSchemaForm
            :schema="fakeRolesSchema"
            v-model="fakeMeetingRoles"
          />
        </DefaultDialog>
      </template>
      <template v-if="userGroups.length">
        <v-list-subheader>
          {{ t('meeting.yourGroups') }}
        </v-list-subheader>
        <v-list-item
          v-for="props in groupList"
          :key="props.title"
          v-bind="props"
          density="compact"
        />
      </template>
    </template>
  </UserMenu>
  <NavigationDrawer />
  <v-main>
    <div id="toolbar"></div>
    <v-container>
      <template v-if="isLoaded">
        <router-view />
        <Bubbles />
      </template>
      <div v-else class="my-8 text-center">
        <v-progress-circular indeterminate />
      </div>
    </v-container>
  </v-main>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, provide, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { RoleContextKey } from '@/injectionKeys'
import DefaultDialog from '@/components/DefaultDialog.vue'
import UserMenu from '@/components/UserMenu.vue'
import AppBar from '@/components/AppBar.vue'
import { user } from '@/composables/useAuthentication'
import usePermission, {
  PermissionDeniedStrategy
} from '@/composables/usePermission'
import JsonSchemaForm from '../forms/JsonSchemaForm.vue'
import { JsonSchema } from '../forms/types'

import Bubbles from './Bubbles.vue'
import useMeetingChannel from './useMeetingChannel'
import useMeetings from './useMeetings'
import useMeeting from './useMeeting'
import useMeetingGroups from './useMeetingGroups'
import NavigationDrawer from './NavigationDrawer.vue'
import { MeetingRole } from './types'
import { DEFAULT_ROLE_ORDER } from './constants'
import { translateMeetingRole } from './utils'
import { hasMeetingRole, setFakeRoles } from './rules'

const { t } = useI18n()
const { meeting, meetingId, roleItems, userRoles } = useMeeting()
const { getMeetingRoleIcon } = useMeetings()

const { groupRoles, userGroups } = useMeetingGroups(meetingId)

function nonParticipantRole(role: MeetingRole) {
  return role !== MeetingRole.Participant
}

const roleList = computed(() => {
  return (DEFAULT_ROLE_ORDER as MeetingRole[])
    .filter((role) => nonParticipantRole(role) && userRoles.value?.has(role))
    .map((role) => ({
      prependIcon: getMeetingRoleIcon(role),
      title: translateMeetingRole(role, t)
    }))
})

const groupList = computed(() => {
  return userGroups.value.map(({ title, memberships }) => {
    const groupRole = memberships.find(
      (membership) => membership.user === user.value?.pk
    )?.role
    return {
      prependIcon: 'mdi-account-group',
      subtitle: groupRoles.value.find(({ pk }) => pk === groupRole)?.title,
      title
    }
  })
})

const { canViewMeeting } = useMeeting()
const { isLoaded, fetchFailed } = useMeetingChannel()

const viewPermission = computed(
  () => !fetchFailed.value && canViewMeeting.value
)

usePermission(viewPermission, undefined, PermissionDeniedStrategy.RequireLogin)

provide(RoleContextKey, 'meeting')

// Allow fake roles for testing purposes
const testDialogOpen = ref(false)
const isActualModerator = computed(() =>
  hasMeetingRole(meetingId.value, MeetingRole.Moderator, true)
)
const fakeMeetingRoles = computed({
  get() {
    return {
      roles: DEFAULT_ROLE_ORDER.filter(
        (r) => nonParticipantRole(r) && hasMeetingRole(meetingId.value, r)
      )
    }
  },
  set({ roles }) {
    setFakeRoles(meetingId.value, [...roles, MeetingRole.Participant])
  }
})
const fakeRolesSchema = computed(() => {
  return {
    properties: {
      roles: {
        type: 'array',
        label: t('meeting.yourRoles'),
        items: {
          type: 'string',
          oneOf: roleItems.value
            .filter(({ value }) => nonParticipantRole(value))
            .map((r) => ({
              const: r.value,
              title: r.title
            }))
        },
        'x-display': 'checkboxes'
      }
    }
  } as JsonSchema<(typeof fakeMeetingRoles)['value']>
})
// Clear fake roles when leaving meeting
onBeforeUnmount(() => setFakeRoles(meetingId.value))
</script>
