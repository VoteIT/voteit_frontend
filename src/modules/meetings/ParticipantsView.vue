<template>
  <MeetingToolbar>
    <v-spacer />
    <v-tabs v-model="currentTab" :items="tabs" />
  </MeetingToolbar>
  <v-row>
    <v-col>
      <v-window v-model="currentTab" :touch="false">
        <v-window-item value="default">
          <RoleMatrix
            :admin="!!canChangeRoles"
            :cols="matrixCols"
            :contentType="meetingType"
            :filter="filterParticipants"
            :icons="roleIcons"
            :pk="meetingId"
            :readonly-roles="readonlyRoles"
            :remove-confirm="removeConfirm"
            :remove-confirm-text="t('meeting.confirmRemoveParticipant')"
          >
            <template #filter>
              <div class="d-flex">
                <v-text-field
                  label="Sök"
                  class="mr-1"
                  clearable
                  v-model="participantFilter.search"
                />
                <v-select
                  :items="roleItems.slice(1)"
                  class="ml-1"
                  multiple
                  label="Begränsa till roller"
                  clearable
                  v-model="participantFilter.roles"
                />
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
                  <router-link
                    to="participants"
                    @click.prevent="currentTab = 'invites'"
                  >
                    {{ t('invites.invites').toLocaleLowerCase() }}
                  </router-link>
                </template>
              </i18n-t>
            </div>
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  prepend-icon="mdi-download"
                  variant="tonal"
                  color="primary"
                >
                  {{ t('download') }}
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  :href="getDownloadUrl('csv')"
                  append-icon="mdi-file-download"
                  :title="`${t('meeting.participants')} (CSV)`"
                />
                <v-list-item
                  :href="getDownloadUrl('json')"
                  append-icon="mdi-file-download"
                  :title="`${t('meeting.participants')} (JSON)`"
                />
              </v-list>
            </v-menu>
          </div>
        </v-window-item>

        <v-window-item value="groups">
          <MeetingGroupsTab />
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

import { getFullName } from '@/utils'
import restApi from '@/utils/restApi'
import { openAlertEvent } from '@/utils/events'
import UserSearch from '@/components/UserSearch.vue'
import RoleMatrix from '@/components/RoleMatrix.vue'
import { UserContextRoles } from '@/composables/types'
import useAuthentication from '@/composables/useAuthentication'
import useTabRoute from '@/composables/useTabRoute'

import { IUser } from '../organisations/types'
import useUserDetails from '../organisations/useUserDetails'
import useOrganisation from '../organisations/useOrganisation'
import SpeakerHistory from '../speakerLists/SpeakerHistory.vue'
import useSpeakerSystems from '../speakerLists/useSpeakerSystems'

import { DEFAULT_ROLE_ORDER } from './constants'
import useMeeting from './useMeeting'
import { MeetingRole } from './types'
import { meetingType } from './contentTypes'
import useMeetingTitle from './useMeetingTitle'
import InvitationsTab from './InvitationsTab.vue'
import MeetingGroupsTab from './MeetingGroupsTab.vue'
import MeetingToolbar from './MeetingToolbar.vue'

const { t } = useI18n()
const { user } = useAuthentication()
const {
  meetingId,
  meetingDialect,
  canChangeRoles,
  canViewMeetingInvite,
  roleIcons,
  roleItems,
  getMeetingRoute
} = useMeeting()
const { getUserIds } = meetingType.useContextRoles()
const { getUser } = useUserDetails()
const { hasSpeakerSystems } = useSpeakerSystems(meetingId)
const { isOrganisationManager } = useOrganisation()

useMeetingTitle(t('meeting.participants'))

function getDownloadUrl(type: 'csv' | 'json') {
  return `${restApi.defaults.baseURL}export-participants/${meetingId.value}/${type}/`
}

const matrixCols = DEFAULT_ROLE_ORDER.slice(1)

function addRole(user: number, role: string) {
  meetingType.addRoles(meetingId.value, user, role)
}

function addUser(user: number) {
  addRole(user, MeetingRole.Participant)
}

const readonlyRoles = computed(() => {
  if (!meetingDialect.value?.block_roles) return
  return Object.fromEntries(
    meetingDialect.value.block_roles.map((role) => [
      role,
      t('meeting.dialectReadonlyRole')
    ])
  )
})

async function removeConfirm(userPk: number, role: string) {
  if (userPk === user.value?.pk && role === 'moderator') {
    openAlertEvent.emit('*' + t('meeting.cantRemoveSelfModerator'))
    return false
  }
  return true
}

const omitIds = computed(() => getUserIds(meetingId.value))
function searchFilter(user: IUser): boolean {
  return !omitIds.value.includes(user.pk)
}

const { currentTab } = useTabRoute(
  getMeetingRoute,
  'participants',
  'participantsTab'
)

function* getExtraTabs() {
  if (hasSpeakerSystems.value)
    yield {
      value: 'speakerHistory',
      text: t('speaker.history')
    }
  if (canViewMeetingInvite.value)
    yield {
      value: 'invites',
      text: t('invites.invites')
    }
}

const tabs = computed(() => {
  return [
    {
      value: 'default',
      text: t('meeting.participants')
    },
    {
      value: 'groups',
      text: t('meeting.groups.groups')
    },
    ...getExtraTabs()
  ]
})

/* Filter for RoleMatrix */
const participantFilter = reactive<{
  roles: string[]
  search: string | null
}>({
  roles: [],
  search: null
})
function filterParticipants({ user, assigned }: UserContextRoles) {
  const { roles, search } = participantFilter
  if (search) {
    const u = getUser(user)
    if (!u) return false
    const joined = `${getFullName(u)} ${u.email}`.toLocaleLowerCase()
    if (!joined.includes(search.toLocaleLowerCase())) return false
  }
  return roles.every((r) => assigned.has(r))
}
</script>
