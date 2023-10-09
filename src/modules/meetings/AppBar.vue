<template>
  <AppBar :title="meeting?.title">
    <template #prependProfile v-if="roleList.length || userGroups.length">
      <template v-if="roleList.length">
        <v-list-subheader>
          {{ t('meeting.yourRoles') }}
        </v-list-subheader>
        <v-list-item v-for="props in roleList" :key="props.title" v-bind="props" density="compact" />
      </template>
      <template v-if="userGroups.length">
        <v-list-subheader>
          {{ t('meeting.yourGroups') }}
        </v-list-subheader>
        <v-list-item v-for="props in groupList" :key="props.title" v-bind="props" density="compact" />
      </template>
    </template>
  </AppBar>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { user } from '@/composables/useAuthentication'
import AppBar from '@/components/AppBar.vue'

import useMeeting from './useMeeting'
import useMeetings from './useMeetings'
import { DEFAULT_ROLE_ORDER } from './constants'
import { MeetingRole } from './types'
import { translateMeetingRole } from './utils'
import useMeetingGroups from './useMeetingGroups'

const { t } = useI18n()
const { meeting, meetingId, userRoles } = useMeeting()
const { getMeetingRoleIcon } = useMeetings()
const { groupRoles, userGroups } = useMeetingGroups(meetingId)

const roleList = computed(() => {
  return (DEFAULT_ROLE_ORDER as MeetingRole[])
    .filter((role) => userRoles.value?.has(role))
    .map(role => ({
      prependIcon: getMeetingRoleIcon(role),
      title: translateMeetingRole(role, t)
    }))
})

const groupList = computed(() => {
  return userGroups.value.map(({ title, memberships }) => {
    const groupRole = memberships.find(membership => membership.user === user.value?.pk)?.role
    return {
      prependIcon: 'mdi-account-group',
      subtitle: groupRoles.value.find(({ pk }) => pk === groupRole)?.title,
      title
    }
  })
})
</script>
