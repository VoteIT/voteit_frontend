<template>

  <div>
    <v-alert closable class="mb-8">
      <p class="mb-4">{{ t('role.help.intro') }}</p>
      <ul>
        <li class="mb-1" v-for="col in columns" :key="col.name">
          <v-icon :icon="col.icon" />
          {{ col.title }} &mdash;
          {{ t('role.help.' + col.name) }}
        </li>
      </ul>
    </v-alert>
    <slot name="filter" />
    <v-pagination v-if="pageCount > 1" v-model="currentPage" :length="pageCount" />
    <v-table class="context-roles" v-if="userMatrix.length" :class="{ orderReversed: ordering.reversed, admin }">
      <thead>
        <tr>
          <th @click="orderUsers(null)" :class="{ orderBy: !ordering.column }">
            {{ t('name') }}
          </th>
          <th v-if="admin">
            {{ t('Email')}}
          </th>
          <th v-for="col in columns" class="text-center" :key="col.name" @click="orderUsers(col.name)" :class="{ orderBy: col.name === ordering.column }">
            <v-tooltip :text="col.title" location="top">
              <template #activator="{ props }">
                <v-icon v-bind="props" :icon="col.icon" />
                {{ col.count() }}
              </template>
            </v-tooltip>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="{ user, row } in pageUsers" :key="user">
          <td><User :pk="user" userid /></td>
          <td v-if="admin">
            <small>
              {{ getUser(user)?.email }}
            </small>
          </td>
          <td v-for="({ name, readonly }, i) in columns" :key="name" class="text-center">
            <v-btn v-if="row[i]" :disabled="readonly || !admin" variant="text" color="success-darken-2" @click="removeRole(user, name)">
              <v-icon icon="mdi-check" />
            </v-btn>
            <v-btn v-else variant="text" :disabled="readonly || !admin" color="warning" @click="addRole(user, name)">
              <v-icon icon="mdi-close" />
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script lang="ts" setup>
import { orderBy as _orderBy } from 'lodash'
import { computed, onBeforeMount, PropType, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import useLoader from '@/composables/useLoader'
import { ContextRole, UserContextRoles } from '@/composables/types'
import ContentType from '@/contentTypes/ContentType'
import useUserDetails from '@/modules/organisations/useUserDetails'

import type { RoleMatrixCol, RoleMatrixColDescription } from './types'

const USERS_PER_PAGE = 50

const props = defineProps({
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
  filter: Function as PropType<(userRoles: UserContextRoles) => boolean>,
  admin: Boolean,
  removeConfirm: Function as PropType<(user: number, role: string) => Promise<boolean>>,
  addConfirm: Function as PropType<(user: number, role: string) => Promise<boolean>>,
  cols: Array as PropType<RoleMatrixCol[]>
})

const { t } = useI18n()
const { getUser } = useUserDetails()
const loader = useLoader('RoleMatrix')
const columns = ref<RoleMatrixColDescription[]>([])
const contextRoles = props.contentType.useContextRoles()

function roleToCol ({ name }: ContextRole): RoleMatrixColDescription {
  return {
    count: () => contextRoles.getRoleCount(props.pk, name),
    hasRole: (user) => user.assigned.has(name),
    icon: props.icons[name],
    name,
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

const ordering = reactive<{ column: string | null, reversed: boolean }>({
  column: null,
  reversed: false
})
// const orderBy = ref<string | null>(null)
// const orderReversed = ref(false)

function orderUsers (column: string | null) {
  if (ordering.column === column) ordering.reversed = !ordering.reversed
  else ordering.column = column
}

function getRow (userRoles: UserContextRoles) {
  return {
    user: userRoles.user,
    row: columns.value.map(c => c.hasRole(userRoles))
  }
}

const userMatrix = computed(() => {
  let userRoles = contextRoles.getAll<string>(props.pk)
  if (props.filter) userRoles = userRoles.filter(props.filter)
  const matrix = userRoles.map(getRow)
  const orderByName = ordering.column === null
  const orderColumn = columns.value.findIndex(c => c.name === ordering.column)
  // Ordering function
  const _ordering: (roles: { user: number, row: boolean[] }) => string | boolean | undefined = orderByName
    // Get user full name to order by
    ? ({ user }) => getUser(user)?.full_name
    : ({ row }) => row[orderColumn]
  // Ordering direction
  const order = (ordering.reversed !== orderByName) // XOR
    ? 'asc'
    : 'desc'
  return _orderBy(
    matrix,
    [_ordering],
    [order]
  )
})

const currentPage = ref(1)
const pageCount = computed(() => Math.ceil(userMatrix.value.length / USERS_PER_PAGE))
const pageUsers = computed(() => {
  return userMatrix.value.slice(USERS_PER_PAGE * (currentPage.value - 1), USERS_PER_PAGE * currentPage.value)
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

<style lang="sass">
// Visual bug in Vuetify
// TODO Remove hopefully!
.v-pagination
  .v-btn__overlay
    --v-border-opacity: .12 !important
</style>
