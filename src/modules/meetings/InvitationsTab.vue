<template>
  <div class="mb-4">
    <div class="d-flex">
      <h1 class="text-truncate">
        {{ t('meeting.invites.existing') }}
      </h1>
      <v-spacer />
      <v-tooltip :modelValue="copied" anchor="top" :text="t('copied')">
        <template #activator="{ props }">
          <v-btn class="mr-2" v-bind="props" @click="copyFilteredData()" :color="copied ? 'success' : undefined" :variant="copied ? 'contained' : 'text'" :title="t('meeting.invites.copyMatchingTooltip')">
            <v-icon>mdi-content-copy</v-icon>
          </v-btn>
        </template>
      </v-tooltip>
      <v-btn class="mr-2" :variant="filterMenu ? 'contained' : 'text'" @click="filterMenu = !filterMenu" :color="filterMenu ? 'accent' : undefined" >
        <v-icon>mdi-filter-menu</v-icon>
      </v-btn>
      <v-dialog v-model="inviteDialogOpen">
        <template #activator="{ props }">
          <div class="text-right mb-2">
            <v-btn v-bind="props" variant="contained" color="primary" prepend-icon="mdi-account-multiple-plus" class="text-no-wrap">
              {{ t('meeting.invites.add') }}
            </v-btn>
          </div>
        </template>
        <v-sheet class="pa-4">
          <div class="d-flex mb-2">
            <h2 class="flex-grow-1">
              {{ t('meeting.invites.add') }}
            </h2>
            <v-btn icon="mdi-close" @click="inviteDialogOpen = false" />
          </div>
          <!-- <SchemaForm :schema="inviteSchema">
            <template #buttons="{ disabled }">
              <v-progress-linear v-if="disabled" indeterminate />
            </template>
          </SchemaForm> -->
          <form @submit.prevent="submitInvites()">
            <v-textarea v-model="inviteData.invite_data" :error="!!inviteErrors.__root__" :messages="inviteErrors.__root__" rows="10" :label="t('meeting.invites.emails')" :hint="t('meeting.invites.emailsHint')" />
            <CheckboxMultipleSelect v-model="inviteData.roles" :settings="{ options: roleLabels }" :label="t('meeting.invites.roles')" :requiredValues="['participant']" />
            <div class="text-right">
              <v-btn v-if="submittingInvites" disabled>
                <v-progress-circular indeterminate size="small" />
              </v-btn>
              <v-btn v-else variant="contained" type="submit" color="primary" prepend-icon="mdi-account-multiple-plus" :disabled="!invitesReady">
                {{ t('add') }}
              </v-btn>
            </div>
          </form>
        </v-sheet>
      </v-dialog>
    </div>
    <v-expand-transition>
      <v-sheet v-show="filterMenu" rounded border>
        <div class="ma-4">
          <CheckboxMultipleSelect v-model="inviteFilter.roles" :settings="{ options: roleLabels }" :label="t('meeting.invites.filterOnRoles')" :requiredValues="['participant']" />
          <v-switch v-model="inviteFilter.exactRoles" color="primary" :label="t('meeting.invites.filterMatchRoles')" />
          <CheckboxMultipleSelect v-model="inviteFilter.states" :settings="{ options: stateLabels }" :label="t('meeting.invites.filterOnStatus')" />
        </div>
      </v-sheet>
    </v-expand-transition>
  </div>
  <v-table class="mb-4">
    <thead>
      <tr>
        <th>
          <input type="checkbox" v-model="allInvitesSelected">
        </th>
        <th>
          {{ t('meeting.invites.data') }}
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
      <v-item v-for="invite in filteredInvites" :key="invite.pk" :value="invite.pk">
        <template v-slot="{ isSelected, toggle }">
          <tr @click="toggle()">
            <td>
              <input type="checkbox" :checked="isSelected" />
            </td>
            <td>
              <v-icon :icon="invite.typeIcon" class="mr-2" />
              {{ invite.invite_data }}
            </td>
            <td>
              <v-tooltip anchor="top" v-for="{ title, icon } in invite.rolesDescription" :key="icon" :text="title">
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
  <v-alert v-if="inviteHelp" v-bind="inviteHelp" class="my-4" />
  <v-expand-transition>
    <v-sheet rounded border v-show="selectedInvites.length">
      <div class="ma-4">
        <h2 class="mb-2">
          {{ t('meeting.invites.bulkChange', selectedInvites.length) }}
        </h2>
        <v-btn variant="contained" prepend-icon="mdi-undo" color="primary" :disabled="!selectedHasDeletable" @click="revokeSelected()" class="mr-1">
          {{ t('meeting.invites.revoke') }}
        </v-btn>
        <v-btn variant="contained" prepend-icon="mdi-delete" color="warning" :disabled="!selectedHasDeletable" @click="deleteSelected()">
          {{ t('delete') }}
        </v-btn>
      </div>
    </v-sheet>
  </v-expand-transition>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { isEqual } from 'lodash'

import { parseSocketError, socket } from '@/utils/Socket'
import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'

import useMeeting from './useMeeting'
import useChannel from '@/composables/useChannel'

import { MeetingInvite, MeetingRole } from './types'
import useMeetingInvites from './useMeetingInvites'
import { canDeleteMeetingInvite } from './rules'
import { meetingInviteType } from './contentTypes'

const meetingIcons: Record<MeetingRole, string> = {
  participant: 'mdi-eye',
  moderator: 'mdi-gavel',
  proposer: 'mdi-note-plus',
  discusser: 'mdi-comment-outline',
  potential_voter: 'mdi-star-outline'
}

export default defineComponent({
  inject: ['cols'],
  setup () {
    const { t } = useI18n()
    const { meetingId, roleLabels } = useMeeting()
    const { meetingInvites } = useMeetingInvites(meetingId)
    const { copy, copied } = useClipboard()

    useChannel(
      'invites',
      meetingId
    )
    // const inviteSchema = computed<FormSchema>(() => {
    //   return [{
    //     name: 'invite_data',
    //     label: t('meeting.invites.emails'),
    //     type: FieldType.TextArea,
    //     rules: [containsEmail]
    //   },
    //   {
    //     name: 'roles',
    //     label: t('meeting.invites.roles'),
    //     type: FieldType.CheckboxMultiple,
    //     options: roleLabels.value
    //   }]
    // })
    const inviteData = reactive({
      invite_data: '',
      roles: ['participant']
    })
    function checkInviteData (): boolean {
      for (const line of inviteData.invite_data.split('\n')) {
        if (line.includes('@')) return true
      }
      return false
    }
    const submittingInvites = ref(false)
    const invitesReady = computed(() => !submittingInvites.value && checkInviteData())
    const inviteDialogOpen = ref(false)
    const inviteErrors = ref<Record<string, string[]>>({})

    async function submitInvites () {
      inviteErrors.value = {}
      submittingInvites.value = true
      try {
        await socket.call('invites.add', {
          invite_data: inviteData.invite_data.split('\n'),
          meeting: meetingId.value,
          roles: inviteData.roles
        }, { alertOnError: false })
        inviteDialogOpen.value = false
        inviteData.invite_data = ''
        inviteData.roles = ['participant']
      } catch (e) {
        inviteErrors.value = parseSocketError(e as Error)
      }
      submittingInvites.value = false
    }

    function getRoleIcon (role: MeetingRole) {
      return meetingIcons[role]
    }
    function getTypeIcon (type: string) {
      // TODO
      return {
        email: 'mdi-email'
      }[type]
    }

    const inviteFilter = reactive({
      roles: ['participant'],
      exactRoles: false,
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

    const filteredInvites = computed(() => {
      const roleSet = new Set(inviteFilter.roles)
      const roleFilter = inviteFilter.exactRoles
        ? (invite: MeetingInvite) => isEqual(roleSet, new Set(invite.roles))
        : (invite: MeetingInvite) => inviteFilter.roles.every((role) => invite.roles.includes(role as MeetingRole))
      return meetingInvites.value
        .filter(inv => roleFilter(inv) && inviteFilter.states.includes(inv.state))
        .map(inv => {
          return {
            ...inv,
            typeIcon: getTypeIcon(inv.type),
            rolesDescription: inv.roles.map(role => ({ title: t(`role.${role}`), icon: getRoleIcon(role) })),
            stateLabel: stateLabels.value[inv.state]
          }
        })
    })

    function copyFilteredData () {
      copy(filteredInvites.value.map(i => i.invite_data).join('\n') + '\n')
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
          type: 'info',
          text: t('meeting.invites.noInvitesHelp')
        }
      }
      if (!filteredInvites.value.length) {
        return {
          type: 'info',
          text: t('meeting.invites.noFilteredInvitesHelp'),
          icon: 'mdi-filter-off'
        }
      }
      return undefined
    })

    return {
      t,
      allInvitesSelected,
      copied,
      filterMenu: ref(false),
      filteredInvites,
      inviteDialogOpen,
      inviteData,
      inviteErrors,
      inviteFilter,
      inviteHelp,
      roleLabels,
      meetingInvites,
      invitesReady,
      selectedInviteIds,
      selectedInvites,
      selectedHasDeletable,
      stateLabels,
      submittingInvites,
      copyFilteredData,
      deleteSelected,
      revokeSelected,
      submitInvites
    }
  },
  components: {
    CheckboxMultipleSelect
    // SchemaForm
  }
})
</script>
