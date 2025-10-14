<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { chunk, isEqual } from 'lodash'

import { socket } from '@/utils/Socket'
import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import useChannel from '@/composables/useChannel'
import usePermission from '@/composables/usePermission'

import { meetingInviteType } from '../meetingInvites/contentTypes'
import { MeetingInvite } from '../meetingInvites/types'
import { meetingInviteStates } from '../meetingInvites/workflowStates'
import { translateInviteType } from '../meetingInvites/utils'
import useMeetingInvites from '../meetingInvites/useMeetingInvites'
import { invitationScopes } from '../organisations/registry'

import useMeeting from './useMeeting'
import { MeetingRole } from './types'
import InvitationModal from '../meetingInvites/InvitationModal.vue'
import InvitationAnnotationsModal from '../meetingInvites/InvitationAnnotationsModal.vue'
import InvitationAnnotation from '../meetingInvites/InvitationAnnotation.vue'
import useInviteAnnotations from '../meetingInvites/useInviteAnnotations'
import { translateMeetingRole } from './utils'
import { canDeleteMeetingInvite } from './rules'

const PAGE_LENGTH = 25

const emit = defineEmits(['denied'])

const { t } = useI18n()
const {
  isModerator,
  meeting,
  meetingId,
  roleLabelsEditable,
  getMeetingRoleIcon
} = useMeeting()
const { meetingInvites } = useMeetingInvites(meetingId)
const { clearableDataTypes } = useInviteAnnotations(meeting)
const { copy, copied } = useClipboard()

const { isSubscribed } = useChannel('invites', meetingId)
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
    meetingInviteStates.map(({ getName, state }) => [state, getName(t, 2)])
  )
})
const selectedInviteIds = ref<number[]>([])
const selectedInvites = computed(() =>
  filteredInvites.value.filter(({ pk }) => selectedInviteIds.value.includes(pk))
)
const selectedHasDeletable = computed(() =>
  selectedInvites.value.some(canDeleteMeetingInvite)
)

const allInvitesSelected = computed({
  get() {
    if (!filteredInvites.value.length) return false
    return filteredInvites.value.every((inv) =>
      selectedInviteIds.value.includes(inv.pk)
    )
  },
  set(value) {
    selectedInviteIds.value = value
      ? filteredInvites.value.map((inv) => inv.pk)
      : []
  }
})

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
      typeLabel: translateInviteType(scope.id, t).typeLabel
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

const pages = computed(() => chunk(filteredInvites.value, PAGE_LENGTH))
const currentPage = ref(1)
// When filtering, the number of pages might change. Make sure currentPage is never higher than number of pages.
watch(pages, (value) => {
  if (currentPage.value > value.length) currentPage.value = value.length || 1
})

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
  // TODO Warn if any were not deletable
  for (const { pk } of selectedInvites.value.filter(canDeleteMeetingInvite)) {
    meetingInviteType.api.delete(pk)
  }
}

async function revokeSelected() {
  // Revoke any selected deletable invites (same as revokable?)
  // TODO Warn if any were not revokable
  for (const inv of selectedInvites.value.filter(canDeleteMeetingInvite)) {
    meetingInviteType.transitions.make(inv, 'revoke', t)
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

async function clearAnnotationType(type: string) {
  await socket.call('invites.clear_annotations', {
    meeting: meetingId.value,
    types: [type]
  })
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
  <v-toolbar color="secondary" :title="$t('invites.existing')">
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
    <DefaultDialog v-if="scopeItems.length === 1" :title="$t('invites.add')">
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
    <v-menu v-else-if="scopeItems.length > 1">
      <template #activator="{ props }">
        <v-btn
          append-icon="mdi-chevron-down"
          class="text-no-wrap"
          :text="$t('invites.add')"
          v-bind="props"
        />
      </template>
      <v-list>
        <DefaultDialog
          v-for="{ icon, title, value } in scopeItems"
          :key="value"
          :title="$t('invites.add')"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" :title="title" :prepend-icon="icon" />
          </template>
          <template #default="{ close }">
            <InvitationModal :type="value" :meeting="meetingId" @done="close" />
          </template>
        </DefaultDialog>
        <DefaultDialog :title="$t('invites.add')">
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              :title="$t('invites.mixed.typeLabel')"
              prepend-icon="mdi-account-star"
            />
          </template>
          <template #default="{ close }">
            <InvitationModal :meeting="meetingId" @done="close" />
          </template>
        </DefaultDialog>
      </v-list>
    </v-menu>
    <v-btn-group variant="text" color="white" density="compact">
      <DefaultDialog :title="$t('invites.annotate.title')">
        <template #activator="{ props }">
          <v-btn
            prepend-icon="mdi-badge-account"
            :text="$t('invites.annotate.title')"
            v-bind="props"
          />
        </template>
        <template #default="{ close }">
          <InvitationAnnotationsModal :meeting="meetingId" @close="close" />
        </template>
      </DefaultDialog>
      <v-menu v-if="hasAnnotations" location="bottom right">
        <template #activator="{ props }">
          <v-btn v-bind="props" size="small">
            <v-icon icon="mdi-chevron-down" />
          </v-btn>
        </template>
        <v-list v-if="clearableDataTypes.length">
          <QueryDialog
            v-for="{ name, title } in clearableDataTypes"
            :key="name"
            :text="$t('invites.annotate.confirmClearType', { title })"
            color="warning"
            @confirmed="clearAnnotationType(name)"
          >
            <template #activator="{ props }">
              <v-list-item
                v-bind="props"
                prepend-icon="mdi-delete-forever"
                :title="$t('invites.annotate.clearType', { title })"
              />
            </template>
          </QueryDialog>
        </v-list>
      </v-menu>
    </v-btn-group>
  </v-toolbar>
  <v-expand-transition>
    <v-sheet v-show="filterMenu" color="secondary" class="rounded-b">
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
  <v-pagination
    v-if="pages.length > 1"
    v-model="currentPage"
    :length="pages.length"
  />
  <v-table class="mb-4">
    <thead>
      <tr>
        <th>
          <input type="checkbox" v-model="allInvitesSelected" />
        </th>
        <th v-for="{ id, icon, typeLabel } in existingInviteScopes" :key="id">
          <v-icon :icon="icon" />
          {{ typeLabel }}
        </th>
        <th>
          {{ $t('roles') }}
        </th>
        <th v-if="hasAnnotations">
          {{ $t('invites.annotate.annotated') }}
        </th>
        <th>
          {{ $t('state') }}
        </th>
      </tr>
    </thead>
    <v-item-group tag="tbody" v-model="selectedInviteIds" multiple>
      <v-item
        v-for="invite in pages[currentPage - 1]"
        :key="invite.pk"
        :value="invite.pk"
      >
        <template v-slot="{ isSelected, toggle }">
          <tr @click="toggle" :class="{ 'bg-secondary-lighten-2': isSelected }">
            <td>
              <input type="checkbox" :checked="isSelected" />
            </td>
            <td v-for="{ id } in existingInviteScopes" :key="id">
              {{ invite.user_data[id] }}
            </td>
            <td>
              <v-tooltip
                location="top"
                v-for="{ title, icon } in invite.rolesDescription"
                :key="icon"
                :text="title"
              >
                <template #activator="{ props }">
                  <v-icon :icon="icon" v-bind="props" />
                </template>
              </v-tooltip>
            </td>
            <th v-if="hasAnnotations">
              <DefaultDialog
                v-if="invite.has_annotations"
                :title="$t('invites.annotate.annotatedTitle')"
              >
                <template #activator="{ props }">
                  <v-icon v-bind="props" icon="mdi-badge-account" />
                </template>
                <template #default="{ close }">
                  <InvitationAnnotation :invite="invite" />
                  <div class="text-right">
                    <v-btn color="primary" :text="$t('close')" @click="close" />
                  </div>
                </template>
              </DefaultDialog>
            </th>
            <td>
              {{ invite.stateLabel }}
            </td>
          </tr>
        </template>
      </v-item>
    </v-item-group>
  </v-table>
  <v-pagination
    v-if="pages.length > 1"
    v-model="currentPage"
    :length="pages.length"
  />
  <div v-if="!isSubscribed" class="text-center my-6">
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
        <QueryDialog
          :text="$t('invites.confirmRevoke', selectedInvites.length)"
          @confirmed="revokeSelected"
        >
          <template #activator="{ props }">
            <v-btn
              class="mr-1"
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
    </v-sheet>
  </v-expand-transition>
</template>
