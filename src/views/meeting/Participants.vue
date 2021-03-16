<template>
  <main>
    <h1>Participants</h1>
    <div class="search">
      <UserSearch @submit="addUser" />
    </div>
    <RoleMatrix :channel="meetingChannel" :pk="meetingId" :icons="meetingIcons" />
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import UserSearch from '@/components/widgets/UserSearch.vue'
import RoleMatrix from '@/components/RoleMatrix.vue'

import useMeeting from '@/composables/meeting/useMeeting'

import { ContextRoles } from '@/composables/types'
import meetingType from '@/contentTypes/meeting'
import { MeetingRole } from '@/contentTypes/types'

const meetingChannel = meetingType.getChannel()

const meetingIcons: Record<MeetingRole, string> = {
  participant: 'mdi-eye',
  moderator: 'mdi-gavel',
  proposer: 'mdi-note-plus',
  discusser: 'mdi-comment-outline',
  potential_voter: 'mdi-star-outline'
}

export default defineComponent({
  inject: ['t'],
  setup () {
    const { meetingId } = useMeeting()

    function addRole (user: number, role: string) {
      meetingChannel.addRoles(meetingId.value, user, role)
    }

    function addUser (user: ContextRoles) {
      addRole(user.pk, MeetingRole.Participant)
    }

    return {
      addUser,
      meetingChannel,
      meetingIcons,
      meetingId
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
