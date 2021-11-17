<template>
  <v-row>
    <v-col v-bind="cols.default">
      <h1>{{ t('meeting.participants') }}</h1>
      <div v-if="canChangeRoles" class="search">
        <UserSearch @submit="addUser" :filter="searchFilter" />
      </div>
      <RoleMatrix :remove-confirm="removeConfirm" :admin="canChangeRoles" :channel="meetingChannel" :pk="meetingId" :icons="meetingIcons" />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
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
import { meetingType } from './contentTypes'
import useMeetingTitle from './useMeetingTitle'

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
    const { meetingId, getUser, canChangeRoles } = useMeeting()
    const { getUserIds } = meetingType.useContextRoles()

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

    return {
      t,
      canChangeRoles,
      meetingChannel: meetingType.channel,
      meetingIcons,
      meetingId,
      addUser,
      getUserIds,
      removeConfirm,
      searchFilter
    }
  },
  components: {
    RoleMatrix,
    UserSearch
  }
})
</script>

<style lang="sass" scoped>
.search
  margin-bottom: 1.5em
</style>
