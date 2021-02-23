<template>
  <main>
    <h1>Participants</h1>
    <user-search @submit="addUser" />
    <table v-if="participants.length" :class="{ orderReversed }">
      <tr>
        <th @click="orderParticipants(null)" :class="{ orderBy: !orderBy }">
          Name
        </th>
        <th v-for="{ name, icon } in roles" :key="name" @click="orderParticipants(name)" :class="{ orderBy: name === orderBy }">
          <icon :name="icon" :title="name" /> {{ roleCount(name) }}
        </th>
      </tr>
      <tr v-for="{ userPk } in participants" :key="userPk">
        <td><user :pk="userPk" /></td>
        <td v-for="{ name } in roles" :key="name">
          <icon v-if="hasRole(name, userPk)" class="active" name="check" @click="removeRole(userPk, name)" />
          <icon v-else name="close" @click="addRole(userPk, name)" />
        </td>
      </tr>
    </table>
  </main>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, ref } from 'vue'

import UserSearch from '@/components/widgets/UserSearch.vue'

import useChannels from '@/composables/useChannels'
import useContextRoles from '@/composables/useContextRoles'
import useLoader from '@/composables/useLoader'
import useMeeting from '@/composables/meeting/useMeeting'

import { ContextRoles } from '@/composables/types'

const TEMP_ROLES = [
  { name: 'moderator', icon: 'gavel' },
  { name: 'proposer', icon: 'post_add' },
  { name: 'discusser', icon: 'comment' },
  { name: 'potential_voter', icon: 'star_outline' },
  { name: 'error', icon: 'error' }
]
const channels = useChannels()

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

    const orderBy = ref<string | null>(null)
    const orderReversed = ref(false)

    function orderMethod (a: any, b: any) { // TODO Types
      let valA, valB
      if (orderBy.value) {
        valA = !a.assigned.has(orderBy.value)
        valB = !b.assigned.has(orderBy.value)
      } else {
        valA = getUser(a.userPk).full_name
        valB = getUser(b.userPk).full_name
      }
      if (valA > valB) {
        return orderReversed.value ? -1 : 1
      }
      if (valA < valB) {
        return orderReversed.value ? 1 : -1
      }
      return 0
    }

    function orderParticipants (role: string) {
      if (orderBy.value === role) {
        orderReversed.value = !orderReversed.value
      } else {
        orderBy.value = role
      }
      participants.value.sort(orderMethod)
    }

    function addUser (user: ContextRoles) {
      addRole(user.pk, 'participant')
    }

    function roleCount (role: string) {
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
table
  width: 100%
  border-spacing: 0
  tr:nth-child(even)
    background-color: #eee
  th
    position: relative
    cursor: pointer
    color: #666
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
    color: #000
</style>
