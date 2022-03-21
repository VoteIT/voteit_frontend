<template>
  <v-row>
    <v-col v-bind="cols.default">
      <Tabs v-model="currentTab" :tabs="tabs">
        <template #default>
          <h1>{{ t('meeting.participants') }}</h1>
          <UserSearch v-if="canChangeRoles" class="mb-6" @submit="addUser" :filter="searchFilter" />
          <RoleMatrix :remove-confirm="removeConfirm" :admin="canChangeRoles" :contentType="meetingType" :pk="meetingId" :icons="meetingIcons" />
        </template>

        <template #invites>
          <div class="mb-4">
            <div class="d-flex">
              <h1 class="text-truncate">
                {{ t('meeting.invites.existing') }}
              </h1>
              <v-spacer />
              <v-btn class="mr-2" @click="copyFilteredData()" :color="copied ? 'success' : undefined" :title="t('meeting.invites.copyMatchingTooltip')">
                <span v-if="copied">{{ t('copied') }}!</span>
                <v-icon v-else>mdi-content-copy</v-icon>
              </v-btn>
              <v-btn class="mr-2" @click="filterMenu = !filterMenu" :color="filterMenu ? 'accent' : undefined" >
                <v-icon>mdi-filter-menu</v-icon>
              </v-btn>
              <v-dialog v-model="invitationDialogOpen">
                <template #activator="{ props }">
                  <div class="text-right mb-2">
                    <v-btn v-bind="props" color="primary" prepend-icon="mdi-account-multiple-plus" class="text-no-wrap">
                      {{ t('meeting.invites.add') }}
                    </v-btn>
                  </div>
                </template>
                <v-sheet class="pa-4">
                  <!-- <SchemaForm :schema="inviteSchema">
                    <template #buttons="{ disabled }">
                      <v-progress-linear v-if="disabled" indeterminate />
                    </template>
                  </SchemaForm> -->
                  <form @submit.prevent="submitInvitations()">
                    <h2 class="mb-1">
                      {{ t('meeting.invites.add') }}
                    </h2>
                    <v-textarea v-model="inviteData.invite_data" :error="!!inviteErrors.__root__" :messages="inviteErrors.__root__" rows="10" :label="t('meeting.invites.emails')" :hint="t('meeting.invites.emailsHint')" />
                    <CheckboxMultipleSelect v-model="inviteData.roles" :settings="{ options: roleLabels }" :label="t('meeting.invites.roles')" :requiredValues="['participant']" />
                    <div class="text-right">
                      <v-btn v-if="submittingInvitations" disabled>
                        <v-progress-circular indeterminate size="small" />
                      </v-btn>
                      <v-btn v-else type="submit" color="primary" prepend-icon="mdi-account-multiple-plus" :disabled="!invitationsReady">
                        {{ t('add') }}
                      </v-btn>
                    </div>
                  </form>
                </v-sheet>
              </v-dialog>
            </div>
            <v-expand-transition>
              <v-sheet v-show="filterMenu" rounded border>
                <div class="ma-4">
                  <CheckboxMultipleSelect v-model="inviteFilter.roles" :settings="{ options: roleLabels }" :label="t('meeting.invites.filterOnRoles')" :requiredValues="['participant']" />
                  <v-switch v-model="inviteFilter.exactRoles" color="primary" :label="t('meeting.invites.filterMatchRoles')" />
                  <CheckboxMultipleSelect v-model="inviteFilter.states" :settings="{ options: stateLabels }" :label="t('meeting.invites.filterOnStatus')" />
                </div>
              </v-sheet>
            </v-expand-transition>
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
              <tr v-for="invite in filteredInvites" :key="invite.pk">
                <td>
                  <v-icon :icon="invite.typeIcon" class="mr-2" />
                  {{ invite.invite_data }}
                </td>
                <td>
                  <!-- <v-tooltip v-for="{ title, icon } in invite.roles" :key="icon" :text="title">
                    <template #activator="{ props }">
                      <v-icon :icon="icon" v-bind="props" />
                    </template>
                  </v-tooltip> -->
                  <v-icon v-for="{ title, icon } in invite.roles" :key="icon" :title="title" :icon="icon" />
                </td>
                <td>
                  {{ invite.state }}
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-alert v-else type="info" :text="t('meeting.invites.noInvitationsHelp')" class="my-4" />
        </template>

        <template #groups>
          <MeetingGroupsTab />
        </template>
        <template #speakerHistory>
          <SpeakerHistory />
        </template>
      </Tabs>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { isEqual } from 'lodash'

import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'
import { parseSocketError, socket } from '@/utils/Socket'
import { openAlertEvent } from '@/utils/events'
import Tabs from '@/components/Tabs.vue'
import UserSearch from '@/components/UserSearch.vue'
import RoleMatrix from '@/components/RoleMatrix.vue'
import { ContextRoles } from '@/composables/types'
import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'

import useMeeting from '../meetings/useMeeting'
import { User } from '../organisations/types'
import SpeakerHistory from '../speakerLists/SpeakerHistory.vue'
import useChannel from '@/composables/useChannel'
import useSpeakerSystems from '../speakerLists/useSpeakerSystems'

import { MeetingInvite, MeetingRole } from './types'
import { meetingType } from './contentTypes'
import useMeetingTitle from './useMeetingTitle'
import useMeetingInvites from './useMeetingInvites'
import useMeetingGroups from './useMeetingGroups'
import MeetingGroupsTab from './MeetingGroupsTab.vue'
import useAuthentication from '@/composables/useAuthentication'

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
    const { user } = useAuthentication()
    const { meetingId, canChangeRoles, canViewMeetingInvite, roleLabels } = useMeeting()
    const { getUserIds } = meetingType.useContextRoles()
    const { meetingInvites } = useMeetingInvites(meetingId)
    const { copy, copied } = useClipboard()
    const { meetingGroups } = useMeetingGroups(meetingId)
    const { hasSpeakerSystems } = useSpeakerSystems(meetingId)

    useMeetingTitle(t('meeting.participants'))

    function addRole (user: number, role: string) {
      meetingType.addRoles(meetingId.value, user, role)
    }

    function addUser (user: ContextRoles) {
      addRole(user.pk, MeetingRole.Participant)
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

    const currentTab = ref('default')
    const tabs = computed(() => {
      if (!canViewMeetingInvite) return
      const tabs = [
        {
          name: 'default',
          title: t('meeting.participants')
        },
        {
          name: 'invites',
          title: t('meeting.invites.invites')
        },
        {
          name: 'groups',
          title: t('meeting.groups.groups')
        }
      ]
      if (hasSpeakerSystems.value) {
        tabs.push({
          name: 'speakerHistory',
          title: t('speaker.history')
        })
      }
      return tabs
    })

    /* INVITES */
    useChannel(
      computed(() => currentTab.value === 'invites' ? 'invites' : undefined),
      meetingId
    )
    // const inviteSchema = computed<FormSchema>(() => {
    //   return [{
    //     name: 'invite_data',
    //     label: t('meeting.invites.emails'),
    //     type: FieldType.TextArea,
    //     rules: [containsEmail]
    //   },
    //   {
    //     name: 'roles',
    //     label: t('meeting.invites.roles'),
    //     type: FieldType.CheckboxMultiple,
    //     options: roleLabels.value
    //   }]
    // })
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
        await socket.call('invites.add', {
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

    const inviteFilter = reactive({
      roles: ['participant'],
      exactRoles: false,
      states: ['open']
    })
    const stateLabels = computed(() => {
      return { // TODO ts
        open: 'Öppen',
        expired: 'Utgången',
        revoked: 'Tillbakadragen',
        accepted: 'Accepterad',
        rejected: 'Avvisad'
      }
    })
    const filteredInvites = computed(() => {
      const roleSet = new Set(inviteFilter.roles)
      const roleFilter = inviteFilter.exactRoles
        ? (invite: MeetingInvite) => isEqual(roleSet, new Set(invite.roles))
        : (invite: MeetingInvite) => inviteFilter.roles.every((role) => invite.roles.includes(role as MeetingRole))
      return meetingInvites.value
        .filter(inv => roleFilter(inv) && inviteFilter.states.includes(inv.state))
        .map(inv => {
          return {
            ...inv,
            typeIcon: getTypeIcon(inv.type),
            roles: inv.roles.map(role => ({ title: t(`meeting.role.${role}`), icon: getRoleIcon(role) })),
            state: stateLabels.value[inv.state]
          }
        })
    })

    function copyFilteredData () {
      copy(filteredInvites.value.map(i => i.invite_data).join('\n') + '\n')
    }

    return {
      t,
      canChangeRoles,
      copied,
      currentTab,
      filterMenu: ref(false),
      filteredInvites,
      invitationDialogOpen,
      inviteData,
      inviteErrors,
      inviteFilter,
      roleLabels,
      meetingType,
      meetingGroups,
      meetingIcons,
      meetingId,
      meetingInvites,
      invitationsReady,
      stateLabels,
      submittingInvitations,
      tabs,
      addUser,
      copyFilteredData,
      getUserIds,
      removeConfirm,
      searchFilter,
      submitInvitations
    }
  },
  components: {
    CheckboxMultipleSelect,
    MeetingGroupsTab,
    RoleMatrix,
    SpeakerHistory,
    Tabs,
    UserSearch
    // SchemaForm
  }
})
</script>
