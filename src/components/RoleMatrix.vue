<template>
  <table class="context-roles" v-if="users.length" :class="{ orderReversed }">
    <thead>
      <tr>
        <th @click="orderUsers(null)" :class="{ orderBy: !orderBy }">
          {{ t('name') }}
        </th>
        <th v-for="{ name, title } in roles" :key="name" @click="orderUsers(name)" :class="{ orderBy: name === orderBy }">
          <Icon :name="getRoleIcon(name)" :title="title"/> {{ roleCount(name) }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="{ user, assigned } in users" :key="user">
        <td><User :pk="user" /></td>
        <td v-for="{ name } in roles" :key="name">
          <Icon v-if="assigned.has(name)" class="active" @click="removeRole(user, name)">check</Icon>
          <Icon v-else @click="addRole(user, name)">close</Icon>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, ref } from 'vue'

import useContextRoles from '@/composables/useContextRoles'
import useLoader from '@/composables/useLoader'
import useMeeting from '@/composables/meeting/useMeeting'
import { ContextRole, UserContextRoles } from '@/composables/types'

import Channel from '@/contentTypes/Channel'
import { ContextRolesPayload } from '@/contentTypes/messages'

export default defineComponent({
  inject: ['t'],
  props: {
    channel: {
      type: Channel,
      required: true
    },
    icons: {
      type: Object,
      required: true
    },
    pk: {
      type: Number,
      required: true
    }
  },
  setup (props) {
    const { getUser } = useMeeting()
    const loader = useLoader('RoleMatrix')
    const roles = ref<ContextRole[]>([])
    const contextRoles = useContextRoles(props.channel.contentType)

    onBeforeMount(() => {
      loader.call(() => {
        return Promise.all([
          props.channel.getAvailableRoles()
            .then(value => {
              roles.value = value
            }),
          props.channel.fetchRoles(props.pk)
            .then(value => {
              const payload = value.p as ContextRolesPayload
              for (const [user, roles] of payload.items) {
                contextRoles.set(props.pk, user, roles)
              }
            })
        ])
      })
    })

    function addRole (user: number, role: string) {
      props.channel.addRoles(props.pk, user, role)
    }
    function removeRole (user: number, role: string) {
      props.channel.removeRoles(props.pk, user, role)
    }

    const orderBy = ref<string | null>(null)
    const orderReversed = ref(false)

    function orderMethod (a: UserContextRoles, b: UserContextRoles) { // TODO Types
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

    function orderUsers (role: string) {
      if (orderBy.value === role) {
        orderReversed.value = !orderReversed.value
      } else {
        orderBy.value = role
      }
    }

    function roleCount (role: string) {
      return contextRoles.getRoleCount(props.pk, role)
    }

    const users = computed(() => {
      const ps = contextRoles.getAll<string>(props.pk)
      ps.sort(orderMethod)
      return ps
    })

    function getRoleIcon (role: string): string {
      return props.icons[role]
    }

    return {
      addRole,
      removeRole,
      roleCount,
      roles,
      getRoleIcon,

      users,
      orderUsers,
      orderBy,
      orderReversed
    }
  }
})
</script>

<style lang="sass" scoped>
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
