<script lang="ts" setup generic="Role extends string">
import { ifilter } from 'itertools'
import { computed, onBeforeMount, shallowRef, type Ref } from 'vue'
import type { FilterFunction } from 'vuetify'
import { useI18n } from 'vue-i18n'

import { getFullName } from '@/utils'
import { ContextRole } from '@/composables/types'
import ContentType from '@/contentTypes/ContentType'
import useAuthStore from '@/modules/auth/useAuthStore'
import { meetingRolePlugins } from '@/modules/meetings/registry'
import useMeeting from '@/modules/meetings/useMeeting'
import useUserDetails from '@/modules/organisations/useUserDetails'

import { DescribedColumn, isDescribedColumn, RoleMatrixColumn } from './types'
import HelpSection from './HelpSection.vue'
import QueryDialog from './QueryDialog.vue'
import User from './User.vue'

const ITEMS_PER_PAGE = 20

const props = withDefaults(
  defineProps<{
    admin: boolean
    addConfirm?(user: number, role: string): Promise<boolean>
    cols?: Role[]
    contentType: ContentType<any, any, Role>
    filter?: FilterFunction
    icons: Record<string, string>
    pk: number
    readonlyRoles?: Record<string, string>
    removeConfirm?(user: number, role: string): Promise<boolean>
    removeConfirmText?: string
  }>(),
  {
    readonlyRoles: () => ({})
  }
)

const { t } = useI18n()
const authStore = useAuthStore()
const { meeting, meetingId } = useMeeting()
const { getUser } = useUserDetails(meetingId)
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

const loading = shallowRef(false)
const availableRoles: Ref<ContextRole<Role>[]> = shallowRef([])
onBeforeMount(async () => {
  loading.value = true
  try {
    const [roles] = await Promise.all([
      props.contentType.getAvailableRoles(),
      props.contentType.fetchRoles(props.pk)
    ])
    availableRoles.value = roles
  } finally {
    loading.value = false
  }
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
  props.contentType.removeRoles(props.pk, user, ...userRoles)
}

function isCurrentUser(userId: number): boolean {
  return userId === authStore.user?.pk
}

const allRoles = computed(() => contextRoles.getAll<Role>(props.pk))

const tableItems = computed(() =>
  allRoles.value.map((userRole) => ({
    user: userRole.user,
    _isCurrentUser: isCurrentUser(userRole.user),
    ...Object.fromEntries(
      columns.value.map((col) => [col.name, col.getValue(userRole)])
    )
  }))
)

const headers = computed(() => [
  {
    title: `${t('name')} (${allRoles.value.length})`,
    key: 'user',
    sortable: true
  },
  ...(props.admin ? [{ title: t('email'), key: 'email' }] : []),
  ...columnTitles.value.map((col) => ({
    title: '',
    key: col.name,
    align: 'center' as const,
    sortable: true
  })),
  ...(props.admin ? [{ title: '', key: 'actions', sortable: false }] : [])
])

const _userSortBy = shallowRef<{ key: string; order: 'asc' | 'desc' }[]>([
  { key: 'user', order: 'asc' }
])
const sortBy = computed({
  get: () => [
    { key: '_isCurrentUser', order: 'desc' as const },
    ..._userSortBy.value
  ],
  set(newVal: { key: string; order: 'asc' | 'desc' }[]) {
    _userSortBy.value = newVal.filter((s) => s.key !== '_isCurrentUser')
  }
})

const customKeySort = {
  user: (a: unknown, b: unknown) => {
    const userA = getUser(a as number)
    const userB = getUser(b as number)
    const nameA = userA ? getFullName(userA).toLocaleLowerCase() : ''
    const nameB = userB ? getFullName(userB).toLocaleLowerCase() : ''
    return nameA.localeCompare(nameB)
  }
}
</script>

<template>
  <div>
    <HelpSection :id="`roleMatrix-${contentType.name}`" start-open class="mb-4">
      <p class="mb-4">{{ $t('role.help.intro') }}</p>
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
    <slot name="filter" :column-descriptions="columnDescriptions"></slot>
    <v-data-table
      :custom-filter="filter"
      :custom-key-sort="customKeySort"
      :search="filter ? ' ' : undefined"
      :headers="headers"
      :loading="loading"
      :hide-default-footer="tableItems.length <= ITEMS_PER_PAGE"
      :items="tableItems"
      :items-per-page="ITEMS_PER_PAGE"
      :items-per-page-text="$t('role.usersPerPage')"
      :page-text="$t('content.pageText')"
      :row-props="
        ({ item }) => ({
          class: { currentUser: isCurrentUser((item as any).user) }
        })
      "
      v-model:sort-by="sortBy"
    >
      <template
        v-for="col in columnTitles"
        #[`header.${col.name}`]="{ column, isSorted, getSortIcon }"
        :key="col.name"
      >
        <v-tooltip :text="col.title" location="top">
          <template #activator="{ props: ttProps }">
            <span v-bind="ttProps">
              <v-icon :icon="col.icon" />
              {{ col.count }}
            </span>
          </template>
        </v-tooltip>
        <v-icon
          v-if="isSorted(column)"
          :icon="getSortIcon(column)"
          size="small"
        />
      </template>

      <template #item.user="{ item }">
        <User :pk="(item as any).user as number" userid />
      </template>

      <template #item.email="{ item }">
        <small>{{ getUser((item as any).user as number)?.email }}</small>
      </template>

      <template
        v-for="col in columns"
        #[`item.${col.name}`]="{ item }"
        :key="col.name"
      >
        <v-btn
          :disabled="!admin || !col.setValue"
          variant="text"
          :color="(item as any)[col.name] ? 'success' : 'warning'"
          @click="
            col.setValue?.(
              (item as any).user as number,
              !(item as any)[col.name]
            )
          "
        >
          <v-icon :icon="(item as any)[col.name] ? 'mdi-check' : 'mdi-close'" />
        </v-btn>
      </template>

      <template v-if="admin" #item.actions="{ item }">
        <div class="text-right">
          <QueryDialog
            v-if="removeConfirmText"
            :text="removeConfirmText"
            color="warning"
            @confirmed="removeAllRoles((item as any).user as number)"
          >
            <template #activator="{ props: dlgProps }">
              <v-btn v-bind="dlgProps" color="warning" variant="text">
                <v-icon icon="mdi-delete" />
              </v-btn>
            </template>
          </QueryDialog>
          <v-btn
            v-else
            color="warning"
            variant="text"
            @click="removeAllRoles((item as any).user as number)"
          >
            <v-icon icon="mdi-delete" />
          </v-btn>
        </div>
      </template>

      <template #no-data>
        <em>{{ $t('noFilteredRoles', allRoles.length) }}</em>
      </template>
    </v-data-table>
  </div>
</template>

<style lang="sass" scoped>
:deep(.currentUser)
  background-color: rgb(var(--v-theme-secondary-lighten-2))
</style>
