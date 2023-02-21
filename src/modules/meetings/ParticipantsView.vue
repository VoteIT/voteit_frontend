<template>
  <teleport to="#toolbar">
    <v-toolbar color="secondary-lighten-2" elevation="1" class="text-black">
      <v-spacer />
      <v-tabs v-model="currentTab" :items="tabs" />
    </v-toolbar>
  </teleport>
  <v-row>
    <v-col>
      <v-window v-model="currentTab" :touch="false">

        <v-window-item value="default">
          <RoleMatrix
            :remove-confirm="removeConfirm"
            :admin="canChangeRoles"
            :contentType="meetingType"
            :pk="meetingId"
            :icons="meetingIcons"
            :cols="matrixCols"
            :filter="filterParticipants"
          >
            <template #filter>
              <div class="d-flex">
                <v-text-field label="Sök" class="mr-1" clearable v-model="participantFilter.search" />
                <v-select :items="roleItems.slice(1)" class="ml-1" multiple label="Begränsa till roller" clearable v-model="participantFilter.roles" />
              </div>
            </template>
          </RoleMatrix>
          <div v-if="canChangeRoles" class="d-flex flex-wrap mt-6">
            <UserSearch
              v-if="isOrganisationManager"
              :label="t('meeting.addParticipant')"
              class="flex-grow-1"
              @submit="addUser"
              :filter="searchFilter"
            >
              <template #hint>
                {{ t('invites.addUserInvitesWarning') }}
              </template>
            </UserSearch>
            <div v-else class="flex-grow-1">
              <i18n-t keypath="invites.invitesGoTo">
                <template #link>
                  <router-link to="participants" @click.prevent="currentTab = 'invites'">
                    {{ t('invites.invites').toLocaleLowerCase() }}
                  </router-link>
                </template>
              </i18n-t>
            </div>
            <v-menu>
              <template #activator="{ props }">
                <v-btn v-bind="props" prepend-icon="mdi-download" variant="tonal" color="primary">
                  {{ t('download') }}
                </v-btn>
              </template>
              <v-list>
                <v-list-item :href="getDownloadUrl('csv')" append-icon="mdi-file-download" :title="`${t('meeting.participants')} (CSV)`" />
                <v-list-item :href="getDownloadUrl('json')" append-icon="mdi-file-download" :title="`${t('meeting.participants')} (JSON)`" />
              </v-list>
            </v-menu>
          </div>
        </v-window-item>

        <v-window-item value="groups">
          <MeetingGroupsTab />
        </v-window-item>

        <v-window-item value="presence" v-if="canManagePresence">
          <PresenceCheckControl class="text-center" />
          <template v-if="presenceCheck">
            <v-divider class="my-4" />
            <h2 class="mb-4">
              {{ t('presence.presentCount', presentUserIds.length) }}
            </h2>
            <UserSearch class="mb-6" @submit="changePresence($event, true)" instant :filter="presenceFilter" :params="{ meeting: meetingId }" :label="t('content.addName', { name: t('presence.presence').toLowerCase() })" />
            <UserList v-if="presentUserIds.length" :userIds="presentUserIds" class="my-2" bgColor="background" density="default">
              <template #appendItem="{ user }">
                <v-btn size="small" variant="text" icon="mdi-close" @click="changePresence(user, false)" />
              </template>
            </UserList>
          </template>
        </v-window-item>

        <v-window-item value="speakerHistory" v-if="hasSpeakerSystems">
          <SpeakerHistory />
        </v-window-item>

        <v-window-item value="invites" v-if="canViewMeetingInvite">
          <InvitationsTab @denied="currentTab = 'default'" />
        </v-window-item>

      </v-window>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import restApi from '@/utils/restApi'
import { ThemeColor } from '@/utils/types'
import { openAlertEvent } from '@/utils/events'
import UserList from '@/components/UserList.vue'
import UserSearch from '@/components/UserSearch.vue'
import RoleMatrix from '@/components/RoleMatrix.vue'
import { UserContextRoles } from '@/composables/types'
import useAuthentication from '@/composables/useAuthentication'
import useAlert from '@/composables/useAlert'
import useTabPath from '@/composables/useTabPath'

import useMeeting from '../meetings/useMeeting'
import { User } from '../organisations/types'
import SpeakerHistory from '../speakerLists/SpeakerHistory.vue'
import useSpeakerSystems from '../speakerLists/useSpeakerSystems'
import usePresence from '../presence/usePresence'
import { presenceType } from '../presence/contentTypes'

import { MeetingRole } from './types'
import { meetingType } from './contentTypes'
import useMeetingTitle from './useMeetingTitle'
import InvitationsTab from './InvitationsTab.vue'
import MeetingGroupsTab from './MeetingGroupsTab.vue'
import useUserDetails from '../organisations/useUserDetails'
import useOrganisation from '../organisations/useOrganisation'

const meetingIcons: Record<MeetingRole, string> = {
  participant: 'mdi-eye',
  moderator: 'mdi-gavel',
  proposer: 'mdi-note-plus',
  discusser: 'mdi-comment-outline',
  potential_voter: 'mdi-star-outline'
}

const { t } = useI18n()
const { user } = useAuthentication()
const { meetingId, meetingPath, canChangeRoles, canViewMeetingInvite, roleItems } = useMeeting()
const { getUserIds } = meetingType.useContextRoles()
const { getUser } = useUserDetails()
const { hasSpeakerSystems } = useSpeakerSystems(meetingId)
const { canManagePresence, presenceCheck, presentUserIds } = usePresence(meetingId)
const { alert } = useAlert()
const { isOrganisationManager } = useOrganisation()

useMeetingTitle(t('meeting.participants'))

function getDownloadUrl (type: 'csv' | 'json') {
  return `${restApi.defaults.baseURL}export-participants/${meetingId.value}/${type}/`
}

const DEFAULT_COLUMNS = [
  'moderator',
  'potential_voter',
  'proposer',
  'discusser'
]
const MODERATOR_COLUMNS = [
  'participant',
  ...DEFAULT_COLUMNS
]

const matrixCols = computed(() => {
  return canChangeRoles.value
    ? MODERATOR_COLUMNS
    : DEFAULT_COLUMNS
})

function addRole (user: number, role: string) {
  meetingType.addRoles(meetingId.value, user, role)
}

function addUser (user: number) {
  addRole(user, MeetingRole.Participant)
}

async function removeConfirm (userPk: number, role: string) {
  if (userPk === user.value?.pk && ['moderator', 'participant'].includes(role)) {
    openAlertEvent.emit('*' + t('meeting.cantRemoveSelfModerator'))
    return false
  }
  if (role === 'participant' && !await dialogQuery({
    title: t('meeting.confirmRemoveParticipant'),
    theme: ThemeColor.Warning
  })) return false
  return true
}

const omitIds = computed(() => getUserIds(meetingId.value))
function searchFilter (user: User): boolean {
  return !omitIds.value.includes(user.pk)
}

const { currentTab } = useTabPath(meetingPath)
const tabs = computed(() => {
  const tabs = [
    {
      value: 'default',
      title: t('meeting.participants')
    },
    {
      value: 'groups',
      title: t('meeting.groups.groups')
    }
  ]
  if (canManagePresence.value) {
    tabs.push({
      value: 'presence',
      title: t('presence.presence')
    })
  }
  if (hasSpeakerSystems.value) {
    tabs.push({
      value: 'speakerHistory',
      title: t('speaker.history')
    })
  }
  if (canViewMeetingInvite.value) {
    tabs.push({
      value: 'invites',
      title: t('invites.invites')
    })
  }
  return tabs
})

function changePresence (user: number, present: boolean) {
  if (!presenceCheck.value) return
  try {
    presenceType.methodCall('change', {
      presence_check: presenceCheck.value.pk,
      present,
      user
    })
  } catch {
    alert(`Cound not ${present ? 'add' : 'remove'} presence`)
  }
}

function presenceFilter ({ pk }: User) {
  return !presentUserIds.value.includes(pk)
}

/* Filter for RoleMatrix */
const participantFilter = reactive({
  roles: [],
  search: ''
})
function filterParticipants ({ user, assigned }: UserContextRoles) {
  const { roles, search } = participantFilter
  if (search) {
    const u = getUser(user)
    if (!u) return false
    const joined = `${u.full_name} ${u.email}`.toLocaleLowerCase()
    if (!joined.includes(search.toLocaleLowerCase())) return false
  }
  return roles.every(r => assigned.has(r))
}
</script>
