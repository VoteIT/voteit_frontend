<template>
  <div>
    <v-pagination v-if="false" v-model="currentPage" :length="pageCount" color="primary" />
    <v-table class="context-roles" v-if="users.length" :class="{ orderReversed, admin }">
      <thead>
        <tr>
          <th @click="orderUsers(null)" :class="{ orderBy: !orderBy }">
            {{ t('name') }}
          </th>
          <th v-for="{ name, title } in roles" :key="name" @click="orderUsers(name)" :class="{ orderBy: name === orderBy }">
            <v-tooltip :text="title">
              <template #activator="{ props }">
                <v-icon v-bind="props" :icon="getRoleIcon(name)" />
                {{ roleCount(name) }}
              </template>
            </v-tooltip>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="{ user, assigned } in users" :key="user">
          <td><User :pk="user" userid /></td>
          <td v-for="{ name } in roles" :key="name">
            <v-icon v-if="assigned.has(name)" class="success" @click="removeRole(user, name)" icon="mdi-check"/>
            <v-icon v-else @click="addRole(user, name)" icon="mdi-close" />
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import useContextRoles from '@/composables/useContextRoles'
import useLoader from '@/composables/useLoader'
import useMeeting from '@/modules/meetings/useMeeting'
import { ContextRole, UserContextRoles } from '@/composables/types'

import Channel from '@/contentTypes/Channel'

const USERS_PER_PAGE = 2

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

    const currentPage = ref(1)
    const pageCount = computed(() => Math.ceil(users.value.length / USERS_PER_PAGE))
    const pageUsers = computed(() => {
      return users.value.slice(USERS_PER_PAGE * (currentPage.value - 1), USERS_PER_PAGE * currentPage.value)
    })

    return {
      t,
      currentPage,
      orderBy,
      orderReversed,
      pageCount,
      pageUsers,
      roles,
      users,
      addRole,
      getRoleIcon,
      orderUsers,
      removeRole,
      roleCount
    }
  }
})
</script>

<style lang="sass" scoped>
.v-table
  th
    position: relative
    cursor: pointer
    color: rgb(var(--v-theme-on-background))
    &.orderBy::after
      content: "↓"
      color: rgba(var(--v-theme-on-background), .5)
      font-size: 1.4em
      position: absolute
      top: 12px
      padding: 0 4px
      transition: transform .1s
  &.orderReversed
    th::after
      transform: rotate(180deg)
  td .mdi
    color: rgb(var(--v-theme-warning))
    &.success
      color: rgb(var(--v-theme-success-darken-2))

  &.admin td .mdi
    cursor: pointer
</style>
