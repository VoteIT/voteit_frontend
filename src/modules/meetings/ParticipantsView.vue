<template>
  <v-row>
    <v-col v-bind="cols.default">
      <Tabs v-model="currentTab" :tabs="tabs">
        <template #default>
          <h1>{{ t('meeting.participants') }}</h1>
          <div v-if="canChangeRoles" class="search">
            <UserSearch @submit="addUser" :filter="searchFilter" />
          </div>
          <RoleMatrix :remove-confirm="removeConfirm" :admin="canChangeRoles" :channel="meetingChannel" :pk="meetingId" :icons="meetingIcons" />
        </template>
        <template #invites>
          <div class="d-flex mb-2">
            <h2>
              {{ t('meeting.invites.existing') }}
            </h2>
            <v-spacer />
            <v-dialog v-model="invitationDialogOpen">
              <template #activator="{ props }">
                <div class="text-right mb-2">
                  <v-btn v-bind="props" color="primary" prepend-icon="mdi-account-multiple-plus">
                    {{ t('meeting.invites.add') }}
                  </v-btn>
                </div>
              </template>
              <v-sheet class="pa-4">
                <form @submit.prevent="submitInvitations()">
                  <h2 class="mb-1">
                    {{ t('meeting.invites.add') }}
                  </h2>
                  <v-textarea v-model="inviteData.invite_data" :error="!!inviteErrors.__root__" :messages="inviteErrors.__root__" rows="10" :label="t('meeting.invites.emails')" :hint="t('meeting.invites.emailsHint')" />
                  <CheckboxMultipleSelect v-model="inviteData.roles" :settings="{ options: inviteRoles }" :label="t('meeting.invites.roles')" :requiredValues="['participant']" />
                  <div class="text-right">
                    <v-btn type="submit" color="primary" prepend-icon="mdi-account-multiple-plus" :disabled="!invitationsReady">
                      {{ t('add') }}
                    </v-btn>
                  </div>
                </form>
              </v-sheet>
            </v-dialog>
          </div>
          <v-table v-if="meetingInvites.length">
            <thead>
              <tr>
                <th>
                  {{ t('meeting.invites.data') }}
                </th>
                <th>
                  {{ t('accessPolicy.rolesGiven') }}
                </th>
                <th>
                  {{ t('state') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="invite in meetingInvites" :key="invite.pk">
                <td>
                  <v-icon :icon="getTypeIcon(invite.type)" class="mr-2" />
                  {{ invite.invite_data }}
                </td>
                <td>
                  <v-tooltip v-for="role in invite.roles" :key="role" :text="t(`meeting.role.${role}`)">
                    <template #activator="{ props }">
                      <v-icon :icon="getRoleIcon(role)" v-bind="props" />
                    </template>
                  </v-tooltip>
                </td>
                <td>
                  {{ invite.state }}
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-alert v-else type="info" :text="t('meeting.invites.noInvitationsHelp')" class="my-4" />
        </template>
      </Tabs>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'
import { openAlertEvent } from '@/utils/events'
import UserSearch from '@/components/UserSearch.vue'
import RoleMatrix from '@/components/RoleMatrix.vue'
import { ContextRoles } from '@/composables/types'

import useMeeting from '../meetings/useMeeting'
import { User } from '../organisations/types'

import { MeetingRole } from './types'
import { meetingInviteType, meetingType } from './contentTypes'
import useMeetingTitle from './useMeetingTitle'
import Tabs from '@/components/Tabs.vue'
import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'
import useMeetingInvites from './useMeetingInvites'
import { parseSocketError } from '@/utils/Socket'

const meetingIcons: Record<MeetingRole, string> = {
  participant: 'mdi-eye',
  moderator: 'mdi-gavel',
  proposer: 'mdi-note-plus',
  discusser: 'mdi-comment-outline',
  potential_voter: 'mdi-star-outline'
}

export default defineComponent({
  inject: ['cols'],
  setup () {
    const { t } = useI18n()
    const { meetingId, getUser, canChangeRoles, canViewMeetingInvite, getRoleLabels } = useMeeting()
    const { getUserIds } = meetingType.useContextRoles()
    const { meetingInvites } = useMeetingInvites(meetingId)

    useMeetingTitle(t('meeting.participants'))

    function addRole (user: number, role: string) {
      meetingType.channel.addRoles(meetingId.value, user, role)
    }

    function addUser (user: ContextRoles) {
      addRole(user.pk, MeetingRole.Participant)
    }

    async function removeConfirm (user: number, role: string) {
      if (user === getUser()?.pk && ['moderator', 'participant'].includes(role)) {
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

    const currentTab = ref('default')
    const tabs = computed(() => {
      if (!canViewMeetingInvite) return
      return [
        {
          name: 'default',
          title: t('meeting.participants')
        },
        {
          name: 'invites',
          title: t('meeting.invites.invites')
        }
      ]
    })
    watch(currentTab, (value) => {
      if (value === 'invites') meetingInviteType.channel.subscribe(meetingId.value)
      else meetingInviteType.channel.leave(meetingId.value)
    })

    /* INVITES */
    const inviteRoles = computed(() => getRoleLabels())
    const inviteData = reactive({
      invite_data: '',
      roles: ['participant']
    })
    function checkInviteData (): boolean {
      for (const line of inviteData.invite_data.split('\n')) {
        if (line.includes('@')) return true
      }
      return false
    }
    const submittingInvitations = ref(false)
    const invitationsReady = computed(() => !submittingInvitations.value && checkInviteData())
    const invitationDialogOpen = ref(false)
    const inviteErrors = ref<Record<string, string[]>>({})
    async function submitInvitations () {
      inviteErrors.value = {}
      submittingInvitations.value = true
      try {
        await meetingInviteType.channel.post('invites.add', {
          invite_data: inviteData.invite_data.split('\n'),
          meeting: meetingId.value,
          roles: inviteData.roles
        }, { alertOnError: false })
        invitationDialogOpen.value = false
        inviteData.invite_data = ''
        inviteData.roles = ['participant']
      } catch (e) {
        inviteErrors.value = parseSocketError(e as Error)
      }
      submittingInvitations.value = false
    }
    function getRoleIcon (role: MeetingRole) {
      return meetingIcons[role]
    }
    function getTypeIcon (type: string) {
      // TODO
      return {
        email: 'mdi-email'
      }[type]
    }

    return {
      t,
      canChangeRoles,
      currentTab,
      invitationDialogOpen,
      inviteData,
      inviteErrors,
      inviteRoles,
      meetingChannel: meetingType.channel,
      meetingIcons,
      meetingId,
      meetingInvites,
      invitationsReady,
      tabs,
      addUser,
      getRoleIcon,
      getTypeIcon,
      getUserIds,
      removeConfirm,
      searchFilter,
      submitInvitations
    }
  },
  components: {
    CheckboxMultipleSelect,
    RoleMatrix,
    UserSearch,
    Tabs
  }
})
</script>

<style lang="sass" scoped>
.search
  margin-bottom: 1.5em
</style>
