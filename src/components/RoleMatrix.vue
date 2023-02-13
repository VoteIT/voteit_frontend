<template>

  <div>
    <v-alert closable class="mb-8">
      <p class="mb-4">{{ t('role.help.intro') }}</p>
      <ul>
        <li class="mb-1" v-for="{ description, icon, name, title } in columnDescriptions" :key="name">
          <v-icon :icon="icon" />
          {{ title }} &mdash; {{ description }}
        </li>
      </ul>
    </v-alert>
    <slot name="filter"></slot>
    <v-pagination v-if="pageCount > 1" v-model="currentPage" :length="pageCount" />
    <v-table class="context-roles" v-if="userMatrix.length" :class="{ orderReversed: ordering.reversed, admin }">
      <thead>
        <tr>
          <th @click="orderUsers(null)" :class="{ orderBy: !ordering.column }">
            {{ t('name') }}
          </th>
          <th v-if="admin">
            {{ t('email')}}
          </th>
          <th v-for="{ count, icon, name, title } in columnTitles" class="text-center" :key="name" @click="orderUsers(name)" :class="{ orderBy: name === ordering.column }">
            <v-tooltip :text="title" location="top">
              <template #activator="{ props }">
                <v-icon v-bind="props" :icon="icon" />
                {{ count }}
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
          <td v-for="({ name, setValue }, i) in columns" :key="name" class="text-center">
            <v-btn
              :disabled="!admin || !setValue"
              variant="text"
              :color="row[i] ? 'success' : 'warning'"
              @click="setValue?.(user, !row[i])"
            >
              <v-icon :icon="row[i] ? 'mdi-check' : 'mdi-close'" />
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script lang="ts" setup>
import { ifilter } from 'itertools'
import { orderBy as _orderBy } from 'lodash'
import { computed, onBeforeMount, PropType, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import useLoader from '@/composables/useLoader'
import { ContextRole, UserContextRoles } from '@/composables/types'
import ContentType from '@/contentTypes/ContentType'
import useUserDetails from '@/modules/organisations/useUserDetails'

import { DescribedColumn, isDescribedColumn, RoleMatrixColumn } from './types'
import { meetingRolePlugins } from '@/modules/meetings/registry'
import useMeeting from '@/modules/meetings/useMeeting'

const USERS_PER_PAGE = 50

const props = defineProps({
  admin: Boolean,
  addConfirm: Function as PropType<(user: number, role: string) => Promise<boolean>>,
  cols: Array as PropType<string[]>,
  contentType: {
    type: ContentType as PropType<ContentType<any, any>>,
    required: true
  },
  filter: Function as PropType<(userRoles: UserContextRoles) => boolean>,
  icons: {
    type: Object,
    required: true
  },
  pk: {
    type: Number,
    required: true
  },
  removeConfirm: Function as PropType<(user: number, role: string) => Promise<boolean>>
})

const { t } = useI18n()
const { getUser } = useUserDetails()
const loader = useLoader('RoleMatrix')
const { meeting } = useMeeting()
const contextRoles = props.contentType.useContextRoles()

/**
 * Create a full column definition from role name.
 */
function roleToCol (name: string): DescribedColumn {
  return {
    getCount () {
      return contextRoles.getRoleCount(props.pk, name)
    },
    getDescription (t) {
      return t(`role.help.${name}`)
    },
    getTitle (t) {
      return t(`role.${name}`)
    },
    getValue (user) {
      return user.assigned.has(name)
    },
    setValue (user, value) {
      if (value) addRole(user, name)
      else removeRole(user, name)
    },
    icon: props.icons[name],
    name
  }
}

const columns = computed(() => {
  const roleNames = props.cols || availableRoles.value.map(r => r.name)
  let columns: RoleMatrixColumn[] = roleNames.map(roleToCol)
  if (!meeting.value) return columns
  for (const plugin of ifilter(
    meetingRolePlugins.getActivePlugins(meeting.value),
    p => p.contentType === props.contentType.name
  )) {
    columns = plugin.transform(columns, meeting.value)
  }
  return columns
})

/**
 * For use in table head
 */
const columnTitles = computed(() => {
  return columns.value
    .map(col => ({
      ...col,
      count: col.getCount(),
      title: col.getTitle(t)
    }))
})

/**
 * For use in help section
 */
const columnDescriptions = computed(() => {
  return columns.value
    .filter(isDescribedColumn)
    .map(col => ({
      ...col,
      description: col.getDescription(t),
      title: col.getTitle(t)
    }))
})

const availableRoles = ref<ContextRole[]>([])
onBeforeMount(() => {
  loader.call(
    async () => {
      availableRoles.value = await props.contentType.getAvailableRoles()
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

function orderUsers (column: string | null) {
  if (ordering.column === column) ordering.reversed = !ordering.reversed
  else ordering.column = column
}

function getRow (userRoles: UserContextRoles) {
  return {
    user: userRoles.user,
    row: columns.value.map(c => c.getValue(userRoles))
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
