<template>
  <main>
    <h1>Participants</h1>
    <div class="search">
      <UserSearch @submit="addUser" />
    </div>
    <table v-if="participants.length" :class="{ orderReversed }">
      <tr>
        <th @click="orderParticipants(null)" :class="{ orderBy: !orderBy }">
          Name
        </th>
        <th v-for="{ name, icon } in roles" :key="name" @click="orderParticipants(name)" :class="{ orderBy: name === orderBy }">
          <Icon :name="icon" :title="name" /> {{ roleCount(name) }}
        </th>
      </tr>
      <tr v-for="{ user } in participants" :key="user">
        <td><User :pk="user" /></td>
        <td v-for="{ name } in roles" :key="name">
          <Icon v-if="hasRole(name, user)" class="active" @click="removeRole(user, name)">check</Icon>
          <Icon v-else @click="addRole(user, name)">close</Icon>
        </td>
      </tr>
    </table>
  </main>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, ref } from 'vue'

import UserSearch from '@/components/widgets/UserSearch.vue'

import useContextRoles from '@/composables/useContextRoles'
import useLoader from '@/composables/useLoader'
import useMeeting from '@/composables/meeting/useMeeting'

import { ContextRoles, UserMeetingRoles } from '@/composables/types'
import Channel from '@/contentTypes/Channel'
import { MeetingRole } from '@/contentTypes/types'

interface RoleIcon {
  name: MeetingRole
  icon: string
}

const TEMP_ROLES: RoleIcon[] = [
  { name: MeetingRole.Moderator, icon: 'gavel' },
  { name: MeetingRole.Proposer, icon: 'post_add' },
  { name: MeetingRole.Discusser, icon: 'comment' },
  { name: MeetingRole.PotentialVoter, icon: 'star_outline' }
]
const channels = new Channel()

export default defineComponent({
  setup () {
    const { meetingId, fetchParticipants, getUser, hasRole } = useMeeting()
    const meetingRoles = useContextRoles('Meeting')
    const loader = useLoader('Participants')

    onBeforeMount(() => {
      loader.call(fetchParticipants)
    })

    function addRole (user: number, role: string) {
      channels.post('meeting.roles.add', {
        pk: meetingId.value,
        roles: [role],
        userids: [user]
      })
    }
    function removeRole (user: number, role: string) {
      channels.post('meeting.roles.remove', {
        pk: meetingId.value,
        roles: [role],
        userids: [user]
      })
    }

    const orderBy = ref<MeetingRole | null>(null)
    const orderReversed = ref(false)

    function orderMethod (a: UserMeetingRoles, b: UserMeetingRoles) { // TODO Types
      let valA, valB
      if (orderBy.value) {
        valA = !a.assigned.has(orderBy.value)
        valB = !b.assigned.has(orderBy.value)
      } else {
        valA = getUser(a.user)
        valB = getUser(b.user)
        if (!valA || !valB) return 0
        valA = valA.full_name
        valB = valB.full_name
      }
      if (valA > valB) {
        return orderReversed.value ? -1 : 1
      }
      if (valA < valB) {
        return orderReversed.value ? 1 : -1
      }
      return 0
    }

    function orderParticipants (role: MeetingRole) {
      if (orderBy.value === role) {
        orderReversed.value = !orderReversed.value
      } else {
        orderBy.value = role
      }
      participants.value.sort(orderMethod)
    }

    function addUser (user: ContextRoles) {
      addRole(user.pk, MeetingRole.Participant)
    }

    function roleCount (role: MeetingRole) {
      return meetingRoles.getRoleCount(meetingId.value, role)
    }

    const participants = computed(() => {
      const ps = meetingRoles.getAll(meetingId.value)
      ps.sort(orderMethod)
      return ps
    })

    return {
      meetingId,
      hasRole,
      addRole,
      removeRole,
      addUser,
      roleCount,
      roles: TEMP_ROLES,

      participants,
      orderParticipants,
      orderBy,
      orderReversed
    }
  },
  components: {
    UserSearch
  }
})
</script>

<style lang="sass" scoped>
.search
  margin-bottom: 1.5em

table
  width: 100%
  border-spacing: 0
  tr:nth-child(even)
    background-color: var(--alt-bg)
  th
    position: relative
    cursor: pointer
    color: var(--btn-text)
    i
      vertical-align: text-bottom
    &.orderBy::after
      content: "↓"
      font-size: 1.4em
      position: absolute
      top: 0
      padding: 0 4px
      transition: transform .1s
  &.orderReversed
    th::after
      transform: rotate(180deg)
  td
    text-align: center
    i
      cursor: pointer
      color: red
      &.active
        color: green
  td:first-child,
  th:first-child
    text-align: left
</style>
