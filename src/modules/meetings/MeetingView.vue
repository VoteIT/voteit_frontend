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
import { computed, provide } from 'vue'
import { useI18n } from 'vue-i18n'

import { RoleContextKey } from '@/injectionKeys'
import UserMenu from '@/components/UserMenu.vue'
import AppBar from '@/components/AppBar.vue'
import { user } from '@/composables/useAuthentication'
import Bubbles from '@/modules/meetings/Bubbles.vue'
import useMeetingChannel from '@/modules/meetings/useMeetingChannel'

import usePermission, {
  PermissionDeniedStrategy
} from '@/composables/usePermission'
import useMeetings from './useMeetings'
import useMeeting from './useMeeting'
import useMeetingGroups from './useMeetingGroups'
import NavigationDrawer from './NavigationDrawer.vue'
import { MeetingRole } from './types'
import { DEFAULT_ROLE_ORDER } from './constants'
import { translateMeetingRole } from './utils'

const { t } = useI18n()
const { meeting, meetingId, userRoles } = useMeeting()
const { getMeetingRoleIcon } = useMeetings()

const { groupRoles, userGroups } = useMeetingGroups(meetingId)
const roleList = computed(() => {
  return (DEFAULT_ROLE_ORDER as MeetingRole[])
    .filter((role) => userRoles.value?.has(role))
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
</script>
