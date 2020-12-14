<template>
  <main>
    <h1>Participants</h1>
    <user-search @submit="addUser" />
    <table v-if="participants.length" :class="{ orderReversed }">
      <tr>
        <th @click="orderParticipants(null)" :class="{ orderBy: !orderBy }">
          Name
        </th>
        <th v-for="role in roles" :key="role.name" @click="orderParticipants(role.name)" :class="{ orderBy: role.name === orderBy }">
          <icon :name="role.icon" :title="role.name" /> {{ roleCount(role.name) }}
        </th>
      </tr>
      <tr v-for="p in participants" :key="p.user.pk">
        <td>{{ p.user.full_name }}</td>
        <td v-for="role in roles" :key="role">
          <icon class="active" v-if="p.assigned.includes(role.name)" name="check" @click="removeRole(p, role.name)" />
          <icon v-else name="close" @click="addRole(p, role.name)" />
        </td>
      </tr>
    </table>
    <p v-else>... loading
      <icon name="face"/>
      <icon name="face"/>
      <icon name="face"/>
    </p>
  </main>
</template>

<script>
import UserSearch from '@/components/widgets/UserSearch.vue'

import useLoader from '@/composables/useLoader.js'
import useRestApi from '@/composables/useRestApi.js'
import useMeeting from '@/composables/meeting/useMeeting.js'
import useMeetingRoles from '@/composables/meeting/useMeetingRoles.js'

const TEMP_ROLES = [
  { name: 'moderator', icon: 'gavel' },
  { name: 'proposer', icon: 'post_add' },
  { name: 'discusser', icon: 'comment' },
  { name: 'potential_voter', icon: 'star_outline' },
  { name: 'error', icon: 'error' }
]

export default {
  setup () {
    const { fetch } = useLoader()
    const { restApi, restError } = useRestApi()
    return {
      ...useMeeting(),
      ...useMeetingRoles(),
      fetch,
      restApi,
      restError
    }
  },
  data () {
    return {
      orderBy: null,
      orderReversed: false,
      roles: TEMP_ROLES
    }
  },
  components: {
    UserSearch
  },
  computed: {
    participants () {
      const participants = this.getMeetingRoles(this.meetingId)
      participants.sort(this.orderMethod)
      return participants
    }
  },
  methods: {
    orderMethod (a, b) {
      let valA, valB
      if (this.orderBy) {
        valA = !a.assigned.includes(this.orderBy)
        valB = !b.assigned.includes(this.orderBy)
      } else {
        valA = a.user.full_name
        valB = b.user.full_name
      }
      if (valA > valB) {
        return this.orderReversed ? -1 : 1
      }
      if (valA < valB) {
        return this.orderReversed ? 1 : -1
      }
      return 0
    },
    orderParticipants (role) {
      if (this.orderBy === role) {
        this.orderReversed = !this.orderReversed
      } else {
        this.orderBy = role
      }
      this.participants.sort(this.orderMethod)
    },
    initialize () {
      return this.fetchMeetingRoles(this.meetingId)
    },
    addUser (user) {
      this.restApi.post('meeting-roles/', {
        user_id: user.pk,
        meeting_id: this.meetingId
      })
        .then(({ data }) => {
          this.setRoles([data]) // As array
        })
        .catch(this.restError)
    },
    addRole (participant, role) {
      this.restApi.post(`meeting-roles/${participant.pk}/add-role/`, { role })
        .then(({ data }) => {
          // TODO: This will be in sockets
          this.setRoles([data]) // Attention: Array
        })
        .catch(this.restError)
    },
    removeRole (participant, role) {
      this.restApi.post(`meeting-roles/${participant.pk}/remove-role/`, { role: role })
        .then(({ data }) => {
          // TODO: This will be in sockets
          this.setRoles([data]) // Attention: Array
        })
        .catch(this.restError)
    },
    roleCount (name) {
      return this.participants.filter(p => p.assigned.includes(name)).length
    }
  },
  created () {
    this.fetch(this.initialize)
  }
}
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
