git<template>
  <main>
    <h1>{{ t('meeting.participants') }}</h1>
    <div v-if="canChangeRoles" class="search">
      <UserSearch @submit="addUser" :omitIds="omitIds" />
    </div>
    <RoleMatrix :remove-confirm="removeConfirm" :admin="canChangeRoles" :channel="meetingChannel" :pk="meetingId" :icons="meetingIcons" />
  </main>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTitle } from '@vueuse/core'

import { dialogQuery, openAlertEvent } from '@/utils'
import { ThemeColor } from '@/utils/types'

import UserSearch from '@/components/UserSearch.vue'
import RoleMatrix from '@/components/RoleMatrix.vue'

import useMeeting from '@/modules/meetings/useMeeting'
import { ContextRoles } from '@/composables/types'

import { MeetingRole } from './types'
import { meetingType } from './contentTypes'

const meetingIcons: Record<MeetingRole, string> = {
  participant: 'mdi-eye',
  moderator: 'mdi-gavel',
  proposer: 'mdi-note-plus',
  discusser: 'mdi-comment-outline',
  potential_voter: 'mdi-star-outline'
}

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const { meetingId, meeting, getUser, canChangeRoles } = useMeeting()
    const { getUserIds } = meetingType.useContextRoles()

    useTitle(computed(() => `${t('meeting.participants')} | ${meeting.value?.title}`))

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

    return {
      t,
      canChangeRoles,
      meetingChannel: meetingType.channel,
      meetingIcons,
      meetingId,
      omitIds,
      addUser,
      getUserIds,
      removeConfirm
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
