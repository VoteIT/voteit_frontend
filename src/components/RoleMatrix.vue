<template>
  <table class="context-roles" v-if="users.length" :class="{ orderReversed, admin }">
    <thead>
      <tr>
        <th @click="orderUsers(null)" :class="{ orderBy: !orderBy }">
          {{ t('name') }}
        </th>
        <th v-for="{ name, title } in roles" :key="name" @click="orderUsers(name)" :class="{ orderBy: name === orderBy }">
          <v-icon :icon="getRoleIcon(name)" :title="title" />
          {{ roleCount(name) }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="{ user, assigned } in users" :key="user">
        <td><User :pk="user" /></td>
        <td v-for="{ name } in roles" :key="name">
          <v-icon v-if="assigned.has(name)" class="success" @click="removeRole(user, name)" icon="mdi-check"/>
          <v-icon v-else @click="addRole(user, name)" icon="mdi-close" />
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import useContextRoles from '@/composables/useContextRoles'
import useLoader from '@/composables/useLoader'
import useMeeting from '@/modules/meetings/useMeeting'
import { ContextRole, UserContextRoles } from '@/composables/types'

import Channel from '@/contentTypes/Channel'

export default defineComponent({
  props: {
    channel: { // TODO Take ContentType object instead?
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
    },
    admin: Boolean,
    removeConfirm: Function as PropType<(user: number, role: string) => Promise<boolean>>,
    addConfirm: Function as PropType<(user: number, role: string) => Promise<boolean>>
  },
  setup (props) {
    const { t } = useI18n()
    const { getUser } = useMeeting()
    const loader = useLoader('RoleMatrix')
    const roles = ref<ContextRole[]>([])
    const contextRoles = useContextRoles(props.channel.contentType)

    onBeforeMount(() => {
      loader.call(
        async () => {
        const data = await props.channel.getAvailableRoles()
          roles.value = data
        },
        async () => {
          const { p } = await props.channel.fetchRoles(props.pk)
          for (const [user, roles] of p.items) {
            contextRoles.set(props.pk, user, roles)
          }
        }
      )
    })

    async function addRole (user: number, role: string) {
      if (!props.admin) return
      if (props.addConfirm && !await props.addConfirm(user, role)) return
      props.channel.addRoles(props.pk, user, role)
    }
    async function removeRole (user: number, role: string) {
      if (!props.admin) return
      if (props.removeConfirm && !await props.removeConfirm(user, role)) return
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
      t,
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
  tbody
    tr
      background-color: rgb(var(--v-theme-surface))
      &:nth-child(even)
        background-color: rgb(var(--v-theme-background))
  th
    position: relative
    cursor: pointer
    color: rgb(var(--v-theme-on-background))
    &.orderBy::after
      content: "↓"
      font-size: 1.4em
      position: absolute
      top: -6px
      padding: 0 4px
      transition: transform .1s
  &.orderReversed
    th::after
      transform: rotate(180deg)
  td
    text-align: center
    .mdi
      color: rgb(var(--v-theme-warning))
      &.success
        color: rgb(var(--v-theme-success-darken-2))
  td:first-child,
  th:first-child
    text-align: left

  &.admin td .mdi
    cursor: pointer
</style>
