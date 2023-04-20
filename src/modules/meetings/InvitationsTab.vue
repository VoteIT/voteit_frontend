<template>
  <v-alert class="mb-4" :title="t('invites.helpTextTitle')" :text="t('invites.helpTextBody')" color="primary" icon="mdi-email-off" />
  <v-toolbar color="secondary" :title="t('invites.existing')">
    <v-tooltip :modelValue="copied" location="top" :text="t('copied')" :open-on-hover="false">
      <template #activator="{ props }">
        <v-btn class="mr-2" v-bind="props" @click="copyFilteredData" :color="copied ? 'success' : undefined" :variant="copied ? 'elevated' : 'text'" :title="t('invites.copyMatchingTooltip')">
          <v-icon>mdi-content-copy</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
    <v-btn class="mr-2 d-none d-md-inline" :variant="filterMenu ? 'elevated' : 'text'" @click="filterMenu = !filterMenu" :color="filterMenu ? 'secondary-lighten-2' : undefined" >
      <v-icon start>mdi-filter-menu</v-icon>
      {{ t('filter') }}
    </v-btn>
    <v-btn class="mr-2 d-md-none" :variant="filterMenu ? 'elevated' : 'text'" @click="filterMenu = !filterMenu" :color="filterMenu ? 'secondary-lighten-2' : undefined" >
      <v-icon>mdi-filter-menu</v-icon>
    </v-btn>
    <DefaultDialog v-if="scopeItems" :title="t('invites.add')" v-model="inviteDialogOpen">
      <template #activator="{ props }">
        <v-btn v-bind="props" prepend-icon="mdi-account-multiple-plus" class="text-no-wrap">
          {{ t('invites.add') }}
        </v-btn>
      </template>
      <v-form @submit.prevent="submitInvites" v-model="inviteData.valid" ref="invitationsForm">
        <v-select
          v-if="scopeItems?.length !== 1"
          class="mb-2"
          :label="t('invites.typeLabel')"
          :items="scopeItems"
          :error-messages="inviteErrors.type"
          v-model="inviteData.type"
          :rules="[rules.required]"
        />
        <v-textarea
          v-model="inviteData.user_data"
          class="mb-2"
          :disabled="!inviteData.type"
          :error-messages="inviteErrors.__root__"
          rows="10"
          v-bind="inviteInputProps"
        />
        <CheckboxMultipleSelect
          v-model="inviteData.roles"
          :settings="{ options: roleLabelsEditable }"
          :label="t('accessPolicy.rolesGiven')"
          :requiredValues="['participant']"
        />
        <div class="text-right">
          <v-btn
            type="submit"
            color="primary"
            prepend-icon="mdi-account-multiple-plus"
            :loading="submittingInvites"
            :disabled="!inviteData.valid || submittingInvites"
            variant="elevated"
          >
            {{ t('add') }}
          </v-btn>
        </div>
      </v-form>
    </DefaultDialog>
  </v-toolbar>
  <v-expand-transition>
    <v-sheet v-show="filterMenu" color="secondary" class="rounded-b">
      <div class="pa-4">
        <v-text-field :label="t('search')" v-model="inviteFilter.search" clearable />
        <CheckboxMultipleSelect v-model="inviteFilter.states" :settings="{ options: stateLabels }" :label="t('invites.filterOnStatus')" />
        <CheckboxMultipleSelect v-model="inviteFilter.roles" :settings="{ options: roleLabelsEditable }" :label="t('invites.filterOnRoles')" :requiredValues="['participant']" />
        <v-switch v-model="inviteFilter.exactRoles" :label="t('invites.filterMatchRoles')" />
      </div>
    </v-sheet>
  </v-expand-transition>
  <v-pagination v-if="pages.length > 1" v-model="currentPage" :length="pages.length" />
  <v-table class="mb-4">
    <thead>
      <tr>
        <th>
          <input type="checkbox" v-model="allInvitesSelected">
        </th>
        <th>
          {{ t('invites.data') }}
        </th>
        <th>
          {{ t('accessPolicy.rolesGiven') }}
        </th>
        <th>
          {{ t('state') }}
        </th>
      </tr>
    </thead>
    <v-item-group tag="tbody" v-model="selectedInviteIds" multiple>
      <v-item v-for="invite in pages[currentPage - 1]" :key="invite.pk" :value="invite.pk">
        <template v-slot="{ isSelected, toggle }">
          <tr @click="toggle" :class="{ 'bg-secondary-lighten-2': isSelected }">
            <td>
              <input type="checkbox" :checked="(isSelected)" />
            </td>
            <td>
              <v-icon :icon="invite.typeIcon" class="mr-2" />
              {{ invite.user_data }}
            </td>
            <td>
              <v-tooltip location="top" v-for="{ title, icon } in invite.rolesDescription" :key="icon" :text="title">
                <template #activator="{ props }">
                  <v-icon :icon="icon" v-bind="props" />
                </template>
              </v-tooltip>
            </td>
            <td>
              {{ invite.stateLabel }}
            </td>
          </tr>
        </template>
      </v-item>
    </v-item-group>
  </v-table>
  <v-pagination v-if="pages.length > 1" v-model="currentPage" :length="pages.length" />
  <div v-if="!isSubscribed" class="text-center my-6">
    <v-progress-circular indeterminate />
  </div>
  <v-alert v-else-if="inviteHelp" type="info" v-bind="inviteHelp" class="my-4" />
  <v-expand-transition>
    <v-sheet rounded border v-show="selectedInvites.length">
      <div class="ma-4">
        <h2 class="mb-2">
          {{ t('invites.bulkChange', selectedInvites.length) }}
        </h2>
        <v-btn prepend-icon="mdi-undo" color="primary" :disabled="!selectedHasDeletable" @click="revokeSelected" class="mr-1">
          {{ t('invites.revoke') }}
        </v-btn>
        <v-btn prepend-icon="mdi-delete" color="warning" :disabled="!selectedHasDeletable" @click="deleteSelected">
          {{ t('content.delete') }}
        </v-btn>
      </div>
    </v-sheet>
  </v-expand-transition>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch, ComponentPublicInstance } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { chunk, isEqual } from 'lodash'

import { parseSocketError, socket } from '@/utils/Socket'
import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'

import useChannel from '@/composables/useChannel'
import usePermission from '@/composables/usePermission'
import useRules from '@/composables/useRules'

import useMeeting from './useMeeting'
import useMeetingInvites from './useMeetingInvites'
import { canDeleteMeetingInvite } from './rules'
import { meetingInviteType } from './contentTypes'
import { MeetingInvite, MeetingRole } from './types'
import { invitationScopes } from '../organisations/registry'

const PAGE_LENGTH = 25

const meetingIcons: Record<MeetingRole, string> = {
  participant: 'mdi-eye',
  moderator: 'mdi-gavel',
  proposer: 'mdi-note-plus',
  discusser: 'mdi-comment-outline',
  potential_voter: 'mdi-star-outline'
}

const emit = defineEmits(['denied'])

const { t } = useI18n()
const { isModerator, meetingId, roleLabelsEditable } = useMeeting()
const { meetingInvites } = useMeetingInvites(meetingId)
const { copy, copied } = useClipboard()
const rules = useRules(t)

const { isSubscribed } = useChannel('invites', meetingId)
usePermission(isModerator, {}, () => { emit('denied') })

const scopeItems = computed(() => {
  const activeScopes = invitationScopes.getActivePlugins()
  if (!activeScopes.length) return
  return activeScopes.map(({ id }) => ({ value: id, title: t(`invites.${id}.typeLabel`) }))
})

const inviteData = reactive({
  type: scopeItems.value?.length === 1
    ? scopeItems.value[0].value
    : undefined,
  user_data: '',
  roles: ['participant'],
  valid: false
})
const submittingInvites = ref(false)
const inviteDialogOpen = ref(false)
const inviteErrors = ref<Partial<Record<string, string[]>>>({})
const inviteInputProps = computed(() => {
  // TODO HERE, dynamic translation strings and even rules
  const { type } = inviteData
  return {
    label: t(`invites.${type}.label`),
    hint: t(`invites.${type}.hint`),
    rules: type
      ? {
          // TODO put this in scope components
          email: [rules.multiline(rules.email), rules.required],
          swedish_ssn: [rules.multiline(rules.swedishSSN), rules.required]
        }[type]
      : [rules.required]
  }
})

// Redo validation if type was changed
const invitationsForm = ref<ComponentPublicInstance<{ resetValidation(): void, validate(): void }> | null>(null)
watch(() => inviteData.type, async () => {
  inviteErrors.value = {}
  invitationsForm.value?.validate()
})
// Reset server sent errors on form update
watch(() => inviteData.user_data, () => {
  inviteErrors.value = {}
})

async function submitInvites () {
  inviteErrors.value = {}
  submittingInvites.value = true
  try {
    await socket.call('invites.add', {
      user_data: inviteData.user_data,
      meeting: meetingId.value,
      roles: inviteData.roles,
      type: inviteData.type
    }, { alertOnError: false })
    inviteDialogOpen.value = false
    inviteData.user_data = ''
    inviteData.roles = ['participant']
  } catch (e) {
    inviteErrors.value = parseSocketError(e as Error)
  }
  submittingInvites.value = false
}

function getRoleIcon (role: MeetingRole) {
  return meetingIcons[role]
}
const typeIcons = computed(() => {
  return Object.fromEntries(
    invitationScopes.getActivePlugins().map(is => [is.id, is.icon])
  )
})

const inviteFilter = reactive({
  roles: ['participant'],
  exactRoles: false,
  search: '',
  states: ['open']
})
const stateLabels = computed(() => {
  return { // TODO ts
    open: 'Öppen',
    expired: 'Utgången',
    revoked: 'Tillbakadragen',
    accepted: 'Accepterad',
    rejected: 'Avvisad'
  }
})
const selectedInviteIds = ref<number[]>([])
const selectedInvites = computed(() => filteredInvites.value.filter(({ pk }) => selectedInviteIds.value.includes(pk)))
const selectedHasDeletable = computed(() => selectedInvites.value.some(canDeleteMeetingInvite))

const allInvitesSelected = computed({
  get () {
    if (!filteredInvites.value.length) return false
    return filteredInvites.value.every(inv => selectedInviteIds.value.includes(inv.pk))
  },
  set (value) {
    selectedInviteIds.value = value
      ? filteredInvites.value.map(inv => inv.pk)
      : []
  }
})

function search (inv: MeetingInvite) {
  return !inviteFilter.search || inv.user_data.toLocaleLowerCase().includes(inviteFilter.search.toLocaleLowerCase())
}

const filteredInvites = computed(() => {
  const roleSet = new Set(inviteFilter.roles)
  const roleFilter = inviteFilter.exactRoles
    ? (invite: MeetingInvite) => isEqual(roleSet, new Set(invite.roles))
    : (invite: MeetingInvite) => inviteFilter.roles.every((role) => invite.roles.includes(role as MeetingRole))
  return meetingInvites.value
    .filter(inv => search(inv) && roleFilter(inv) && inviteFilter.states.includes(inv.state))
    .map(inv => {
      return {
        ...inv,
        user_data: inv.user_data, // FIXME invitationScopes.getPlugin(inv.type)?.transformData?.(inv.user_data) || inv.user_data,
        // typeIcon: typeIcons.value[inv.type], #FIXME
        typeIcon: typeIcons.value.email,
        rolesDescription: inv.roles.map(role => ({ title: t(`role.${role}`), icon: getRoleIcon(role) })),
        stateLabel: stateLabels.value[inv.state]
      }
    })
})

const pages = computed(() => chunk(filteredInvites.value, PAGE_LENGTH))
const currentPage = ref(1)

function copyFilteredData () {
  copy(filteredInvites.value.map(i => i.user_data).join('\n') + '\n')
}

async function deleteSelected () {
  // Delete any selected deletable invites
  // TODO Confirm dialog
  // TODO Warn if any were not deletable
  for (const { pk } of selectedInvites.value.filter(canDeleteMeetingInvite)) {
    meetingInviteType.api.delete(pk)
  }
}

async function revokeSelected () {
  // Revoke any selected deletable invites (same as revokable?)
  // TODO Warn if any were not revokable
  for (const { pk } of selectedInvites.value.filter(canDeleteMeetingInvite)) {
    meetingInviteType.api.transition(pk, 'revoke')
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
</script>
