<script lang="ts" setup>
import { isEqual } from 'lodash'
import { computed, reactive, ref } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import useAlert from '@/composables/useAlert'
import useChannel from '@/socket/useChannel'
import usePermission from '@/composables/usePermission'

import useMeeting from '../meetings/useMeeting'
import { MeetingRole } from '../meetings/types'
import InvitationModal from '../meetingInvites/InvitationModal.vue'
import InvitationAnnotation from '../meetingInvites/InvitationAnnotation.vue'
import { getMeetingRoleIcon, translateMeetingRole } from '../meetings/utils'
import { canDeleteMeetingInvite } from '../meetings/rules'
import { invitationScopes } from '../organisations/registry'

import { MeetingInvite } from './types'
import { translateInviteType } from './utils'
import useMeetingInvites from './useMeetingInvites'
import useInviteStore from './useInviteStore'
import { inviteChannel, meetingInviteType } from './contentTypes'

const ITEMS_PER_PAGE = 25

const emit = defineEmits(['denied'])

const { t } = useI18n()
const { alert } = useAlert()
const { isModerator, meetingId, roleLabelsEditable } = useMeeting()
const { bulkDelete, bulkRevoke } = useInviteStore()
const { meetingInvites } = useMeetingInvites(meetingId)
const { copy, copied } = useClipboard()

const { subscribed } = useChannel(inviteChannel, meetingId)
usePermission(isModerator, {}, () => {
  emit('denied')
})

const scopeItems = computed(() => {
  const activeScopes = invitationScopes.getActivePlugins()
  return activeScopes.map(({ icon, id }) => ({
    icon,
    title: translateInviteType(id, t).typeLabel,
    value: id
  }))
})

const inviteFilter = reactive<{
  roles: string[]
  exactRoles: boolean
  search: string | null
  states: string[]
}>({
  roles: [MeetingRole.Participant],
  exactRoles: false,
  search: null,
  states: ['open']
})
const stateLabels = computed(() => {
  return Object.fromEntries(
    meetingInviteType.sm
      .getStateList()
      .map(({ state, translate }) => [state, translate(t, 2)])
  )
})
const selectedInviteIds = ref<number[]>([])
const selectedInvites = computed(() =>
  filteredInvites.value.filter(({ pk }) => selectedInviteIds.value.includes(pk))
)
const selectedHasDeletable = computed(() =>
  selectedInvites.value.some(canDeleteMeetingInvite)
)

function search(inv: MeetingInvite) {
  const searchLower = inviteFilter.search?.toLocaleLowerCase()
  return (
    !searchLower ||
    Object.values(inv.user_data).some((data) =>
      data.toLocaleLowerCase().includes(searchLower)
    )
  )
}

const existingInviteScopes = computed(() => {
  return invitationScopes
    .getActivePlugins()
    .filter((scope) =>
      meetingInvites.value.some((inv) => scope.id in inv.user_data)
    )
    .map((scope) => ({
      ...scope,
      typeLabel: translateInviteType(scope.id, t).typeLabel ?? scope.id
    }))
})

function transformUserdata(userData: MeetingInvite['user_data']) {
  return Object.fromEntries(
    Object.entries(userData).map(([scope, value]) => {
      const plugin = invitationScopes.getPlugin(scope)
      if (!plugin) throw new Error(`Bad user data scope: ${scope}`)
      return [scope, plugin.transformData?.(value) || value]
    })
  )
}

const filteredInvites = computed(() => {
  const roleSet = new Set(inviteFilter.roles)
  const roleFilter = inviteFilter.exactRoles
    ? (invite: MeetingInvite) => isEqual(roleSet, new Set(invite.roles))
    : (invite: MeetingInvite) =>
        inviteFilter.roles.every((role) =>
          invite.roles.includes(role as MeetingRole)
        )
  return meetingInvites.value
    .filter(
      (inv) =>
        search(inv) &&
        roleFilter(inv) &&
        inviteFilter.states.includes(inv.state)
    )
    .map((inv) => {
      return {
        ...inv,
        user_data: transformUserdata(inv.user_data),
        rolesDescription: inv.roles.map((role) => ({
          title: translateMeetingRole(role, t),
          icon: getMeetingRoleIcon(role)
        })),
        stateLabel: stateLabels.value[inv.state]
      }
    })
})

function* iterHeaders() {
  for (const scope of existingInviteScopes.value)
    yield {
      key: `user_data.${scope.id}`,
      title: scope.typeLabel
    }
  yield { key: 'roles', title: t('roles'), sortable: false }
  if (hasAnnotations.value)
    yield {
      title: t('invites.annotate.annotated'),
      key: 'annotations',
      sortRaw: (a: any, b: any) =>
        Number(a.has_annotations) - Number(b.has_annotations)
    }
  yield {
    title: t('state'),
    key: 'state',
    sortRaw: (a: any, b: any) => a.stateLabel.localeCompare(b.stateLabel)
  }
}

const headers = computed(() => [...iterHeaders()])

function copyFilteredData(scope?: string) {
  copy(
    filteredInvites.value
      .map((i) => i.user_data[scope || existingInviteScopes.value[0].id])
      .filter(Boolean)
      .join('\n') + '\n'
  )
}

async function deleteSelected() {
  // Delete any selected deletable invites
  try {
    await bulkDelete(meetingId.value, selectedInviteIds.value)
  } catch {
    alert('^' + t('invites.errorDelete'))
  }
}

async function revokeSelected() {
  // Revoke any selected deletable invites (same as revokable?)
  try {
    await bulkRevoke(meetingId.value, selectedInviteIds.value)
  } catch {
    alert('^' + t('invites.errorRevoke'))
  }
}

const inviteHelp = computed(() => {
  if (!meetingInvites.value.length) {
    return {
      text: t('invites.noInvitesHelp')
    }
  }
  if (!filteredInvites.value.length) {
    return {
      text: t('invites.noFilteredInvitesHelp'),
      icon: 'mdi-filter-off'
    }
  }
  return undefined
})

const filterMenu = ref(false)
const hasAnnotations = computed(() =>
  meetingInvites.value.some((inv) => inv.has_annotations)
)

const selectedWithAnnotations = computed(() =>
  meetingInvites.value.filter((a) => selectedInviteIds.value.includes(a.pk))
)
async function clearSelectedAnnotations() {
  const invites = selectedWithAnnotations.value.map((i) => i.pk)
  try {
    await meetingInviteType.api.listAction('clear-annotations', {
      invites,
      meeting: meetingId.value
    })
  } catch {
    alert('^' + t('invites.errorClearAnnotations'))
  }
}
</script>

<template>
  <v-alert
    class="mb-4"
    :title="$t('invites.helpTextTitle')"
    :text="$t('invites.helpTextBody')"
    color="primary"
    icon="mdi-email-off"
  />
  <v-toolbar
    class="rounded-t"
    color="secondary"
    :title="$t('invites.existing')"
  >
    <v-tooltip
      v-if="existingInviteScopes.length === 1"
      :modelValue="copied"
      location="top"
      :text="$t('copied')"
      :open-on-hover="false"
    >
      <template #activator="{ props }">
        <v-btn
          class="mr-2"
          :color="copied ? 'success' : undefined"
          :title="$t('invites.copyMatchingTooltip')"
          :variant="copied ? 'elevated' : 'text'"
          v-bind="props"
          @click="copyFilteredData()"
        >
          <v-icon>mdi-content-copy</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
    <v-menu v-else-if="existingInviteScopes.length > 1">
      <template #activator="{ props }">
        <v-btn v-bind="props" append-icon="mdi-chevron-down">
          <v-tooltip
            :modelValue="copied"
            location="top"
            :text="$t('copied')"
            :open-on-hover="false"
          >
            <template #activator="{ props }">
              <v-icon v-bind="props">mdi-content-copy</v-icon>
            </template>
          </v-tooltip>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="{ icon, id, typeLabel } in existingInviteScopes"
          :key="id"
          :prepend-icon="icon"
          :title="typeLabel"
          @click="copyFilteredData(id)"
        />
      </v-list>
    </v-menu>
    <v-btn
      class="mr-2 d-none d-md-inline"
      :variant="filterMenu ? 'elevated' : 'text'"
      @click="filterMenu = !filterMenu"
      :color="filterMenu ? 'secondary-lighten-2' : undefined"
    >
      <v-icon start>mdi-filter-menu</v-icon>
      {{ $t('filter') }}
    </v-btn>
    <v-btn
      class="mr-2 d-md-none"
      :variant="filterMenu ? 'elevated' : 'text'"
      @click="filterMenu = !filterMenu"
      :color="filterMenu ? 'secondary-lighten-2' : undefined"
    >
      <v-icon>mdi-filter-menu</v-icon>
    </v-btn>
    <DefaultDialog :title="$t('invites.add')" width="920">
      <template #activator="{ props }">
        <v-btn
          class="text-no-wrap"
          prepend-icon="mdi-account-multiple-plus"
          :text="$t('invites.add')"
          v-bind="props"
        />
      </template>
      <template #default="{ close }">
        <InvitationModal
          :type="scopeItems[0].value"
          :meeting="meetingId"
          @done="close"
        />
      </template>
    </DefaultDialog>
  </v-toolbar>
  <v-expand-transition>
    <v-sheet v-show="filterMenu" color="secondary">
      <div class="pa-4">
        <v-text-field
          :label="$t('search')"
          v-model="inviteFilter.search"
          clearable
        />
        <CheckboxMultipleSelect
          v-model="inviteFilter.states"
          :settings="{ options: stateLabels }"
          :label="$t('invites.filterOnStatus')"
        />
        <CheckboxMultipleSelect
          v-model="inviteFilter.roles"
          :settings="{ options: roleLabelsEditable }"
          :label="$t('invites.filterOnRoles')"
          :requiredValues="[MeetingRole.Participant]"
        />
        <v-switch
          v-model="inviteFilter.exactRoles"
          :label="$t('invites.filterMatchRoles')"
        />
      </div>
    </v-sheet>
  </v-expand-transition>
  <v-data-table
    class="mb-3"
    :headers="headers"
    :hide-default-footer="filteredInvites.length <= ITEMS_PER_PAGE"
    :items="filteredInvites"
    :items-per-page="ITEMS_PER_PAGE"
    :items-per-page-text="$t('content.itemsPerPageText')"
    :page-text="$t('content.pageText')"
    item-value="pk"
    show-select
    v-model="selectedInviteIds"
  >
    <template
      v-for="scope in existingInviteScopes"
      #[`header.user_data.${scope.id}`]="{ column, getSortIcon }"
      :key="scope.id"
    >
      <v-icon :icon="scope.icon" />
      {{ scope.typeLabel }}
      <v-icon
        class="v-data-table-header__sort-icon"
        :icon="getSortIcon(column)"
      />
    </template>

    <template
      v-for="scope in existingInviteScopes"
      #[`item.user_data.${scope.id}`]="{ item }"
      :key="scope.id"
    >
      {{ item.user_data[scope.id] }}
    </template>

    <template #item.roles="{ item }">
      <v-tooltip
        location="top"
        v-for="{ title, icon } in item.rolesDescription"
        :key="icon"
        :text="title"
      >
        <template #activator="{ props }">
          <v-icon :icon="icon" v-bind="props" />
        </template>
      </v-tooltip>
    </template>

    <template v-if="hasAnnotations" #item.annotations="{ item }">
      <DefaultDialog
        v-if="item.has_annotations"
        :title="$t('invites.annotate.annotatedTitle')"
      >
        <template #activator="{ props }">
          <v-icon v-bind="props" icon="mdi-badge-account" />
        </template>
        <template #default="{ close }">
          <InvitationAnnotation :invite="item" />
          <div class="text-right">
            <v-btn color="primary" :text="$t('close')" @click="close" />
          </div>
        </template>
      </DefaultDialog>
    </template>

    <template #item.state="{ item }">
      {{ item.stateLabel }}
    </template>
  </v-data-table>
  <div v-if="!subscribed" class="text-center my-6">
    <v-progress-circular indeterminate />
  </div>
  <v-alert
    v-else-if="inviteHelp"
    type="info"
    v-bind="inviteHelp"
    class="my-4"
  />
  <v-expand-transition>
    <v-sheet rounded border v-show="selectedInvites.length">
      <div class="ma-4">
        <h2 class="mb-2">
          {{ $t('invites.bulkChange', selectedInvites.length) }}
        </h2>
        <div class="d-flex ga-1">
          <QueryDialog
            :text="$t('invites.confirmRevoke', selectedInvites.length)"
            @confirmed="revokeSelected"
          >
            <template #activator="{ props }">
              <v-btn
                color="primary"
                :disabled="!selectedHasDeletable"
                prepend-icon="mdi-undo"
                :text="$t('invites.revoke')"
                v-bind="props"
              />
            </template>
          </QueryDialog>
          <QueryDialog
            color="warning"
            :text="
              $t('invites.confirmClearAnnotations', selectedInvites.length)
            "
            @confirmed="clearSelectedAnnotations"
          >
            <template #activator="{ props }">
              <v-btn
                color="secondary"
                :disabled="!selectedWithAnnotations.length"
                prepend-icon="mdi-eraser"
                :text="$t('invites.clearAnnotations')"
                v-bind="props"
              />
            </template>
          </QueryDialog>
          <QueryDialog
            color="warning"
            :text="$t('invites.confirmDelete', selectedInvites.length)"
            @confirmed="deleteSelected"
          >
            <template #activator="{ props }">
              <v-btn
                color="warning"
                :disabled="!selectedHasDeletable"
                prepend-icon="mdi-delete"
                :text="$t('content.delete')"
                v-bind="props"
              />
            </template>
          </QueryDialog>
        </div>
      </div>
    </v-sheet>
  </v-expand-transition>
</template>
