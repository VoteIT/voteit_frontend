<template>
  <div>
    <HelpSection :id="`roleMatrix-${contentType.name}`" start-open class="mb-4">
      <p class="mb-4">{{ t('role.help.intro') }}</p>
      <ul>
        <li
          class="mb-1"
          v-for="{ description, icon, name, title } in columnDescriptions"
          :key="name"
        >
          <v-icon :icon="icon" />
          {{ title }} &mdash; {{ description }}
        </li>
      </ul>
    </HelpSection>
    <slot name="filter"></slot>
    <v-pagination
      v-if="pageCount > 1"
      v-model="currentPage"
      :length="pageCount"
    />
    <v-table
      class="context-roles"
      v-if="userMatrix.length"
      :class="{ orderReversed: ordering.reversed, admin }"
    >
      <thead>
        <tr>
          <th @click="orderUsers(null)" :class="{ orderBy: !ordering.column }">
            {{ t('name') }}
          </th>
          <th v-if="admin">
            {{ t('email') }}
          </th>
          <th
            v-for="{ count, icon, name, title } in columnTitles"
            class="text-center"
            :key="name"
            @click="orderUsers(name)"
            :class="{ orderBy: name === ordering.column }"
          >
            <v-tooltip :text="title" location="top">
              <template #activator="{ props }">
                <v-icon v-bind="props" :icon="icon" />
                {{ count }}
              </template>
            </v-tooltip>
          </th>
          <th v-if="admin"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="{ user, row } in pageUsers"
          :key="user"
          :class="{ currentUser: isCurrentUser({ user }) }"
        >
          <td><User :pk="user" userid /></td>
          <td v-if="admin">
            <small>
              {{ getUser(user)?.email }}
            </small>
          </td>
          <td
            v-for="({ name, setValue }, i) in columns"
            :key="name"
            class="text-center"
          >
            <v-btn
              :disabled="!admin || !setValue"
              variant="text"
              :color="row[i] ? 'success' : 'warning'"
              @click="setValue?.(user, !row[i])"
            >
              <v-icon :icon="row[i] ? 'mdi-check' : 'mdi-close'" />
            </v-btn>
          </td>
          <td v-if="admin" class="text-right">
            <QueryDialog
              v-if="removeConfirmText"
              :text="removeConfirmText"
              color="warning"
              @confirmed="removeAllRoles(user)"
            >
              <template #activator="{ props }">
                <v-btn v-bind="props" color="warning" variant="text">
                  <v-icon icon="mdi-delete" />
                </v-btn>
              </template>
            </QueryDialog>
            <v-btn
              v-else
              color="warning"
              @click="removeAllRoles(user)"
              variant="text"
            >
              <v-icon icon="mdi-delete" />
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script lang="ts" setup generic="Role extends string">
import { ifilter } from 'itertools'
import { Dictionary, orderBy as _orderBy } from 'lodash'
import { computed, onBeforeMount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getFullName } from '@/utils'
import useLoader from '@/composables/useLoader'
import { ContextRole, UserContextRoles } from '@/composables/types'
import { user } from '@/composables/useAuthentication'
import ContentType from '@/contentTypes/ContentType'
import useUserDetails from '@/modules/organisations/useUserDetails'
import { meetingRolePlugins } from '@/modules/meetings/registry'
import useMeeting from '@/modules/meetings/useMeeting'

import { DescribedColumn, isDescribedColumn, RoleMatrixColumn } from './types'
import HelpSection from './HelpSection.vue'
import QueryDialog from './QueryDialog.vue'
import User from './User.vue'
import { Ref } from 'vue'

const USERS_PER_PAGE = 50

const props = withDefaults(
  defineProps<{
    admin: boolean
    addConfirm?(user: number, role: string): Promise<boolean>
    cols?: Role[]
    contentType: ContentType<any, any, Role>
    filter?(userRoles: UserContextRoles): boolean
    icons: Dictionary<string>
    pk: number
    readonlyRoles?: Dictionary<string>
    removeConfirm?(user: number, role: string): Promise<boolean>
    removeConfirmText?: string
  }>(),
  {
    readonlyRoles: () => ({})
  }
)

const { t } = useI18n()
const { getUser } = useUserDetails()
const loader = useLoader('RoleMatrix')
const { meeting } = useMeeting()
const contextRoles = props.contentType.useContextRoles()

function translateRoleHelp(role: Role): string {
  const roleSpec = props.contentType.getRole(role)
  return roleSpec ? roleSpec.translateHelp(t) : '-'
}

function translateRoleName(role: Role): string {
  const roleSpec = props.contentType.getRole(role)
  return roleSpec ? roleSpec.translateName(t) : role
}

/**
 * Create a full column definition from role name.
 */
function roleToCol(name: Role): DescribedColumn {
  const readonlyColumn: DescribedColumn = {
    getCount() {
      return contextRoles.getRoleCount(props.pk, name)
    },
    getDescription() {
      return translateRoleHelp(name)
    },
    getTitle() {
      const title = translateRoleName(name)
      return name in props.readonlyRoles
        ? `${title} (${props.readonlyRoles[name]})`
        : title
    },
    getValue(user) {
      return user.assigned.has(name)
    },
    icon: props.icons[name],
    name
  }
  if (name in props.readonlyRoles) return readonlyColumn
  return {
    ...readonlyColumn,
    setValue(user, value) {
      if (value) addRole(user, name)
      else removeRole(user, name)
    }
  }
}

const columns = computed(() => {
  const roleNames = props.cols || availableRoles.value.map((r) => r.name)
  let columns: RoleMatrixColumn[] = roleNames.map(roleToCol)
  if (!meeting.value) return columns
  for (const plugin of ifilter(
    meetingRolePlugins.getActivePlugins(meeting.value),
    (p) => p.contentType === props.contentType.name
  )) {
    columns = plugin.transform(columns, meeting.value)
  }
  return columns
})

/**
 * For use in table head
 */
const columnTitles = computed(() => {
  return columns.value.map((col) => ({
    ...col,
    count: col.getCount(),
    title: col.getTitle(t)
  }))
})

/**
 * For use in help section
 */
const columnDescriptions = computed(() => {
  return columns.value.filter(isDescribedColumn).map((col) => ({
    ...col,
    description: col.getDescription(t),
    title: col.getTitle(t)
  }))
})

const availableRoles: Ref<ContextRole<Role>[]> = ref([])
onBeforeMount(() => {
  loader.call(
    async () => {
      availableRoles.value = await props.contentType.getAvailableRoles()
    },
    () => props.contentType.fetchRoles(props.pk)
  )
})

async function addRole(user: number, role: string) {
  if (!props.admin) return
  if (props.addConfirm && !(await props.addConfirm(user, role))) return
  props.contentType.addRoles(props.pk, user, role)
}
async function removeRole(user: number, role: string) {
  if (!props.admin) return
  if (props.removeConfirm && !(await props.removeConfirm(user, role))) return
  props.contentType.removeRoles(props.pk, user, role)
}

async function removeAllRoles(user: number) {
  if (!props.admin) return
  const userRoles = contextRoles.getUserRoles(props.pk, user)
  if (!userRoles) throw new Error(`User ${user} has no roles in this context`)
  console.log(userRoles)
  props.contentType.removeRoles(props.pk, user, ...userRoles)
}

const ordering = reactive<{ column: string | null; reversed: boolean }>({
  column: null,
  reversed: false
})

function orderUsers(column: string | null) {
  if (ordering.column === column) ordering.reversed = !ordering.reversed
  else ordering.column = column
}

function getRow(userRoles: UserContextRoles) {
  return {
    user: userRoles.user,
    row: columns.value.map((c) => c.getValue(userRoles))
  }
}

function isCurrentUser(roles: { user: number }): boolean {
  return roles.user === user.value?.pk
}

const userMatrix = computed(() => {
  let userRoles = contextRoles.getAll<string>(props.pk)
  if (props.filter) userRoles = userRoles.filter(props.filter)
  const matrix = userRoles.map(getRow)
  const orderByName = ordering.column === null
  const orderColumn = columns.value.findIndex((c) => c.name === ordering.column)
  // Ordering function
  const _ordering: (roles: {
    user: number
    row: boolean[]
  }) => string | boolean | undefined = orderByName
    ? ({ user }) => {
        const _user = getUser(user)
        if (_user) return getFullName(_user) // Get user full name to order by
      }
    : ({ row }) => row[orderColumn]
  // Ordering direction
  const order =
    ordering.reversed !== orderByName // XOR
      ? 'asc'
      : 'desc'
  return _orderBy(matrix, [isCurrentUser, _ordering], ['desc', order])
})

const currentPage = ref(1)
const pageCount = computed(() =>
  Math.ceil(userMatrix.value.length / USERS_PER_PAGE)
)
const pageUsers = computed(() => {
  return userMatrix.value.slice(
    USERS_PER_PAGE * (currentPage.value - 1),
    USERS_PER_PAGE * currentPage.value
  )
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

.currentUser
  background-color: rgb(var(--v-theme-secondary-lighten-2))
</style>

<style lang="sass">
// Visual bug in Vuetify
// TODO Remove hopefully!
.v-pagination
  .v-btn__overlay
    --v-border-opacity: .12 !important
</style>
