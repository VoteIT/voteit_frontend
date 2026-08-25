<script lang="ts" setup>
import { computed, onUnmounted, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { openDialogEvent } from '@/utils/events'
import { cols } from '@/utils/defaults'
import UserMenu from '@/components/UserMenu.vue'
import AppBar from '@/components/AppBar.vue'
import useLoader from '@/composables/useLoader'
import usePermission, {
  PermissionDeniedStrategy
} from '@/composables/usePermission'
import useAuthStore from '../auth/useAuthStore'

import Bubbles from './Bubbles.vue'
import ComponentSlot from './ComponentSlot.vue'
import FakeRolesDialog from './FakeRolesDialog.vue'
import NavigationDrawer from './NavigationDrawer.vue'
import useMeetingChannel from './useMeetingChannel'
import useMeeting from './useMeeting'
import useMeetingGroups from './useMeetingGroups'
import { MeetingRole } from './types'
import { DEFAULT_ROLE_ORDER } from './constants'
import { getMeetingRoleIcon, translateMeetingRole } from './utils'
import { meetingType } from './contentTypes'

const { t } = useI18n()
const authStore = useAuthStore()
const { meeting, meetingId, userRoles } = useMeeting()

const { groupRoles, userGroups } = useMeetingGroups(meetingId)

function nonParticipantRole(role: MeetingRole) {
  return role !== MeetingRole.Participant
}

const roleList = computed(() => {
  return DEFAULT_ROLE_ORDER.filter(
    (role) => nonParticipantRole(role) && userRoles.value?.has(role)
  ).map((role) => ({
    prependIcon: getMeetingRoleIcon(role),
    title: translateMeetingRole(role, t)
  }))
})

const groupList = computed(() => {
  return userGroups.value.map(({ title, memberships }) => {
    const groupRole = memberships.find(
      (membership) => membership.user === authStore.user?.pk
    )?.role
    return {
      prependIcon: 'mdi-account-group',
      subtitle: groupRoles.value.find(({ pk }) => pk === groupRole)?.title,
      title
    }
  })
})

const { canViewMeeting } = useMeeting()
const { isLoaded, fetchFailed, progress } = useMeetingChannel()

// Even if everything arrives at once, keep the loading screen up long enough
// that it doesn't flash by. While the app-wide Loader covers the screen there's
// nothing to flash, so count it as passed right away.
const MIN_LOADING_TIME = 1_000
const { loaderVisible } = useLoader('MeetingView')
const minTimePassed = shallowRef(loaderVisible.value)
if (!minTimePassed.value) {
  const minTimeTimer = setTimeout(
    () => (minTimePassed.value = true),
    MIN_LOADING_TIME
  )
  onUnmounted(() => clearTimeout(minTimeTimer))
}

const viewPermission = computed(
  () => !fetchFailed.value && canViewMeeting.value
)

usePermission(viewPermission, {}, PermissionDeniedStrategy.RequireLogin)

function promptDialectReload() {
  openDialogEvent.emit({
    resolve(reload) {
      if (reload) location.reload()
      else setTimeout(promptDialectReload, 30_000) // re-ask after 30 s to give users time to finish their action
    },
    title: t('meeting.dialectReloadQuery'),
    dismissible: false,
    no: t('system.reloadLater'),
    yes: t('system.reloadNow')
  })
}

meetingType.on<{ pk: number }>('dialect_changed', ({ pk }) => {
  if (pk === meetingId.value) promptDialectReload()
})
</script>

<template>
  <AppBar hasNavDrawer :title="meeting?.title" />
  <UserMenu>
    <template #prependProfile v-if="roleList.length || userGroups.length">
      <template v-if="roleList.length">
        <v-list-subheader>
          {{ $t('meeting.yourRoles') }}
        </v-list-subheader>
        <v-list-item
          v-for="props in roleList"
          :key="props.title"
          v-bind="props"
          density="compact"
        />
        <FakeRolesDialog />
      </template>
      <template v-if="userGroups.length">
        <v-list-subheader>
          {{ $t('meeting.yourGroups') }}
        </v-list-subheader>
        <v-list-item
          v-for="props in groupList"
          :key="props.title"
          v-bind="props"
          density="compact"
        />
      </template>
      <ComponentSlot name="appendUserMenu" />
    </template>
  </UserMenu>
  <NavigationDrawer />
  <v-main>
    <div id="toolbar"></div>
    <v-container>
      <template v-if="isLoaded && minTimePassed">
        <router-view />
        <Bubbles />
      </template>
      <v-row v-else>
        <!-- Indeterminate until the channels have announced what they'll send -->
        <v-col v-bind="cols.default">
          <p>
            {{
              meeting
                ? $t('meeting.loadingTitled', { title: meeting.title })
                : $t('meeting.loading')
            }}
          </p>
          <v-progress-linear
            :indeterminate="!progress.total"
            :model-value="progress.curr"
            :max="progress.total"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>
