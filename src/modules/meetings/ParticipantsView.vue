<template>
  <v-row>
    <v-col v-bind="cols.default">
      <v-tabs v-model="currentTab" :items="tabs" right class="mb-4" />
      <v-window v-model="currentTab">

        <v-window-item value="default">
          <h1>{{ t('meeting.participants') }}</h1>
          <UserSearch v-if="canChangeRoles" class="mb-6" @submit="addUser" :filter="searchFilter" />
          <RoleMatrix :remove-confirm="removeConfirm" :admin="canChangeRoles" :contentType="meetingType" :pk="meetingId" :icons="meetingIcons" />
        </v-window-item>

        <v-window-item value="groups">
          <MeetingGroupsTab />
        </v-window-item>

        <v-window-item value="speakerHistory">
          <SpeakerHistory />
        </v-window-item>

        <v-window-item value="invites">
          <InvitationsTab />
        </v-window-item>

      </v-window>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'
import { openAlertEvent } from '@/utils/events'
import UserSearch from '@/components/UserSearch.vue'
import RoleMatrix from '@/components/RoleMatrix.vue'
import { ContextRoles } from '@/composables/types'

import useMeeting from '../meetings/useMeeting'
import { User } from '../organisations/types'
import SpeakerHistory from '../speakerLists/SpeakerHistory.vue'
import useSpeakerSystems from '../speakerLists/useSpeakerSystems'

import { MeetingRole } from './types'
import { meetingType } from './contentTypes'
import useMeetingTitle from './useMeetingTitle'
import useMeetingGroups from './useMeetingGroups'
import InvitationsTab from './InvitationsTab.vue'
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
      if (hasSpeakerSystems.value) {
        tabs.push({
          value: 'speakerHistory',
          title: t('speaker.history')
        })
      }
      if (canViewMeetingInvite.value) {
        tabs.push({
          value: 'invites',
          title: t('meeting.invites.invites')
        })
      }
      return tabs
    })

    return {
      t,
      canChangeRoles,
      currentTab,
      roleLabels,
      meetingType,
      meetingGroups,
      meetingIcons,
      meetingId,
      tabs,
      addUser,
      getUserIds,
      removeConfirm,
      searchFilter
    }
  },
  components: {
    InvitationsTab,
    MeetingGroupsTab,
    RoleMatrix,
    SpeakerHistory,
    UserSearch
  }
})
</script>
