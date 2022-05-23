<template>
  <div>
    <v-pagination v-if="false" v-model="currentPage" :length="pageCount" color="primary" />
    <v-table class="context-roles" v-if="users.length" :class="{ orderReversed, admin }">
      <thead>
        <tr>
          <th @click="orderUsers(null)" :class="{ orderBy: !orderBy }">
            {{ t('name') }}
          </th>
          <th v-for="col in columns" class="text-center" :key="col.name" @click="col.orderBy && col.orderBy()" :class="{ orderBy: col.name === orderBy }">
            <v-tooltip :text="col.title" anchor="top">
              <template #activator="{ props }">
                <v-icon v-bind="props" :icon="col.icon" />
                {{ col.count() }}
              </template>
            </v-tooltip>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user">
          <td><User :pk="user.user" userid /></td>
          <td v-for="{ hasRole, name, readonly } in columns" :key="name" class="text-center">
            <v-btn v-if="hasRole(user)" :disabled="readonly || !admin" variant="text" color="success-darken-2" @click="removeRole(user.user, name)">
              <v-icon icon="mdi-check" />
            </v-btn>
            <v-btn v-else variant="text" :disabled="readonly || !admin" color="warning" @click="addRole(user.user, name)">
              <v-icon icon="mdi-close" />
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import useLoader from '@/composables/useLoader'
import { ContextRole, UserContextRoles } from '@/composables/types'
import ContentType from '@/contentTypes/ContentType'
import useUserDetails from '@/modules/organisations/useUserDetails'
import { RoleMatrixCol, RoleMatrixColDescription } from './types'

const USERS_PER_PAGE = 2

export default defineComponent({
  props: {
    contentType: {
      type: Object as PropType<ContentType>,
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
    addConfirm: Function as PropType<(user: number, role: string) => Promise<boolean>>,
    cols: Array as PropType<RoleMatrixCol[]>
  },
  setup (props) {
    const { t } = useI18n()
    const { getUser } = useUserDetails()
    const loader = useLoader('RoleMatrix')
    // const roles = ref<ContextRole[]>([])
    const columns = ref<RoleMatrixColDescription[]>([])
    const contextRoles = props.contentType.useContextRoles()

    function roleToCol ({ name }: ContextRole): RoleMatrixColDescription {
      return {
        count: () => contextRoles.getRoleCount(props.pk, name),
        hasRole: (user) => user.assigned.has(name),
        icon: props.icons[name],
        name,
        orderBy: () => orderUsers(name),
        title: t(`role.${name}`)
      }
    }

    onBeforeMount(() => {
      loader.call(
        async () => {
          const roles = await props.contentType.getAvailableRoles()
          // roles.value = data
          if (props.cols) {
            columns.value = props.cols.map(col => {
              if (typeof col === 'string') return roleToCol(roles.find(r => r.name === col) as ContextRole)
              return col
            })
          } else {
            columns.value = roles.map(roleToCol)
          }
        },
        () => props.contentType.fetchRoles(props.pk)
      )
    })

    async function addRole (user: number, role: string) {
      if (!props.admin) return
      if (props.addConfirm && !await props.addConfirm(user, role)) return
      props.contentType.addRoles(props.pk, user, role)
    }
    async function removeRole (user: number, role: string) {
      if (!props.admin) return
      if (props.removeConfirm && !await props.removeConfirm(user, role)) return
      props.contentType.removeRoles(props.pk, user, role)
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
      columns,
      currentPage,
      orderBy,
      orderReversed,
      pageCount,
      pageUsers,
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
      content: "⬇"
      color: rgba(var(--v-theme-on-background), .4)
      font-size: 1.4em
      position: absolute
      top: 12px
      padding: 0 4px
      transition: transform .1s
  &.orderReversed
    th::after
      transform: rotate(180deg)
</style>
