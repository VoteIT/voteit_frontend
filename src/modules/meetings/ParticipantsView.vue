<template>
  <v-row>
    <v-col v-bind="cols.default">
      <Tabs v-model="currentTab" :tabs="tabs">
        <template #default>
          <h1>{{ t('meeting.participants') }}</h1>
          <UserSearch v-if="canChangeRoles" class="mb-6" @submit="addUser" :filter="searchFilter" />
          <RoleMatrix :remove-confirm="removeConfirm" :admin="canChangeRoles" :channel="meetingChannel" :pk="meetingId" :icons="meetingIcons" />
        </template>
        <template #invites>
          <div class="mb-4">
            <div class="d-flex">
              <h1>
                {{ t('meeting.invites.existing') }}
              </h1>
              <v-spacer />
              <v-btn class="mr-2" @click="copyFilteredData()" :color="copied ? 'success' : undefined" >
                <span v-if="copied">{{ t('copied') }}!</span>
                <v-icon v-else>mdi-content-copy</v-icon>
              </v-btn>
              <v-btn class="mr-2" @click="filterMenu = !filterMenu" :color="filterMenu ? 'accent' : undefined" >
                <v-icon>mdi-filter-menu</v-icon>
              </v-btn>
              <v-dialog v-model="invitationDialogOpen">
                <template #activator="{ props }">
                  <div class="text-right mb-2">
                    <v-btn v-bind="props" color="primary" prepend-icon="mdi-account-multiple-plus">
                      {{ t('meeting.invites.add') }}
                    </v-btn>
                  </div>
                </template>
                <v-sheet class="pa-4">
                  <form @submit.prevent="submitInvitations()">
                    <h2 class="mb-1">
                      {{ t('meeting.invites.add') }}
                    </h2>
                    <v-textarea v-model="inviteData.invite_data" :error="!!inviteErrors.__root__" :messages="inviteErrors.__root__" rows="10" :label="t('meeting.invites.emails')" :hint="t('meeting.invites.emailsHint')" />
                    <CheckboxMultipleSelect v-model="inviteData.roles" :settings="{ options: roleLabels }" :label="t('meeting.invites.roles')" :requiredValues="['participant']" />
                    <div class="text-right">
                      <v-btn type="submit" color="primary" prepend-icon="mdi-account-multiple-plus" :disabled="!invitationsReady">
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
                  <CheckboxMultipleSelect v-model="inviteFilter.roles" :settings="{ options: roleLabels }" label="Filtrera på roller" :requiredValues="['participant']" />
                  <v-switch v-model="inviteFilter.exactRoles" color="primary" label="Matcha roller exakt" />
                </div>
              </v-sheet>
            </v-expand-transition>
          </div>
          <v-table v-if="meetingInvites.length">
            <thead>
              <tr>
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
            <tbody>
              <tr v-for="invite in filteredInvites" :key="invite.pk">
                <td>
                  <v-icon :icon="getTypeIcon(invite.type)" class="mr-2" />
                  {{ invite.invite_data }}
                </td>
                <td>
                  <v-tooltip v-for="role in invite.roles" :key="role" :text="t(`meeting.role.${role}`)">
                    <template #activator="{ props }">
                      <v-icon :icon="getRoleIcon(role)" v-bind="props" />
                    </template>
                  </v-tooltip>
                </td>
                <td>
                  {{ invite.state }}
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-alert v-else type="info" :text="t('meeting.invites.noInvitationsHelp')" class="my-4" />
        </template>
        <template #groups>
          <v-alert type="warning" class="mb-4">
            Grupper i VoteIT är under utveckling. Du kan lägga till och ta bort grupper, med inte hantera medlemskap.
          </v-alert>
          <div class="d-flex mb-4">
            <h1>
              {{ t('meeting.groups.groups') }}
            </h1>
            <v-spacer />
            <v-dialog>
              <template #activator="{ props }">
                <v-btn color="primary" prepend-icon="mdi-account-multiple-plus" v-bind="props">
                  {{ t('meeting.groups.create') }}
                </v-btn>
              </template>
              <template #default="{ isActive }">
                <v-sheet rounded class="pa-4">
                  <h2 class="mb-2">
                    {{ t('meeting.groups.new') }}
                  </h2>
                  <SchemaForm :schema="groupSchema" :handler="createGroup" @saved="isActive.value = false">
                    <template #buttons="{ disabled, valid }">
                      <div class="text-right">
                        <v-btn variant="text" @click="isActive.value = false" :disabled="disabled">
                          {{ t('cancel') }}
                        </v-btn>
                        <v-btn type="submit" color="primary" :disabled="disabled || !valid" prepend-icon="mdi-account-multiple-plus">
                          {{ t('meeting.groups.create') }}
                        </v-btn>
                      </div>
                    </template>
                  </SchemaForm>
                </v-sheet>
              </template>
            </v-dialog>
          </div>
          <v-table>
            <thead>
              <tr>
                <th>
                  {{ t('name') }}
                </th>
                <th colspan="2">
                  {{ t('meeting.groups.members') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="group in meetingGroups" :key="group.pk">
                <td>
                  {{ group.title }}
                </td>
                <td>
                  {{ group.members.length || '-' }}
                  <v-dialog v-if="group.members.length">
                    <template #activator="{ props }">
                      <v-btn v-bind="props" size="small" color="secondary" class="ml-2">
                        {{ t('show') }}
                      </v-btn>
                    </template>
                    <template #default="{ isActive }">
                      <v-sheet rounded class="pa-4">
                        <div class="d-flex">
                          <h2>
                            {{ t('meeting.groups.membersIn', group) }}
                          </h2>
                          <v-spacer />
                          <v-btn icon="mdi-close" size="small" flat @click="isActive.value = false" style="position: relative; top: -.5em; right: -.5em;" />
                        </div>
                        <UserList :userIds="group.members" />
                      </v-sheet>
                    </template>
                  </v-dialog>
                </td>
                <td class="text-right">
                  <v-dialog>
                    <template #activator="{ props }">
                      <v-btn size="small" color="primary" v-bind="props">
                        {{ t('edit') }}
                      </v-btn>
                    </template>
                    <template #default="{ isActive }">
                      <v-sheet rounded class="pa-4">
                        <h2 class="mb-2">
                          {{ t('meeting.groups.modify') }}
                        </h2>
                        <SchemaForm :schema="groupSchema" :handler="changeGroup(group.pk)" :modelValue="{ title: group.title }" @saved="isActive.value = false">
                          <template #buttons="{ disabled, valid }">
                            <div class="text-right">
                              <v-btn @click="isActive.value = false" variant="text" :disabled="disabled">
                                {{ t('cancel') }}
                              </v-btn>
                              <v-btn @click="deleteGroup(group).then((done) => { isActive.value = !done })" variant="text" color="warning">
                                {{ t('delete') }}
                              </v-btn>
                              <v-btn type="submit" color="primary" :disabled="disabled || !valid">
                                {{ t('save') }}
                              </v-btn>
                            </div>
                          </template>
                        </SchemaForm>
                      </v-sheet>
                    </template>
                  </v-dialog>
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </Tabs>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, watch } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { isEqual } from 'lodash'

import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'
import { parseSocketError } from '@/utils/Socket'
import { openAlertEvent } from '@/utils/events'
import UserSearch from '@/components/UserSearch.vue'
import RoleMatrix from '@/components/RoleMatrix.vue'
import { ContextRoles } from '@/composables/types'

import useMeeting from '../meetings/useMeeting'
import { User } from '../organisations/types'

import { MeetingGroup, MeetingInvite, MeetingRole } from './types'
import { meetingGroupType, meetingInviteType, meetingType } from './contentTypes'
import useMeetingTitle from './useMeetingTitle'
import Tabs from '@/components/Tabs.vue'
import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'
import useMeetingInvites from './useMeetingInvites'
import useMeetingGroups from './useMeetingGroups'
import SchemaForm from '@/components/SchemaForm.vue'
import { FieldRule } from '@/components/types'
import UserList from '@/components/UserList.vue'
import useAuthentication from '@/composables/useAuthentication'

const meetingIcons: Record<MeetingRole, string> = {
  participant: 'mdi-eye',
  moderator: 'mdi-gavel',
  proposer: 'mdi-note-plus',
  discusser: 'mdi-comment-outline',
  potential_voter: 'mdi-star-outline'
}

const required: FieldRule<string> = {
  props: { required: true },
  validate: v => !!v || 'required'
}

export default defineComponent({
  inject: ['cols'],
  setup () {
    const { t } = useI18n()
    const { meetingId, getUser, canChangeRoles, canViewMeetingInvite, roleLabels } = useMeeting()
    const { getUserIds } = meetingType.useContextRoles()
    const { meetingInvites } = useMeetingInvites(meetingId)
    const { copy, copied } = useClipboard()
    const { meetingGroups } = useMeetingGroups(meetingId)
    const { user } = useAuthentication()

    useMeetingTitle(t('meeting.participants'))

    function addRole (user: number, role: string) {
      meetingType.channel.addRoles(meetingId.value, user, role)
    }

    function addUser (user: ContextRoles) {
      addRole(user.pk, MeetingRole.Participant)
    }

    async function removeConfirm (user: number, role: string) {
      if (user === getUser()?.pk && ['moderator', 'participant'].includes(role)) {
        openAlertEvent.emit('*' + t('meeting.cantRemoveSelfModerator'))
        return false
      }
      if (role === 'participant' && !await dialogQuery({
        title: t('meeting.confirmRemoveParticipant'),
        theme: ThemeColor.Warning
      })) return false
      return true
    }

    const omitIds = computed(() => getUserIds(meetingId.value))
    function searchFilter (user: User): boolean {
      return !omitIds.value.includes(user.pk)
    }

    const currentTab = ref('default')
    const tabs = computed(() => {
      if (!canViewMeetingInvite) return
      return [
        {
          name: 'default',
          title: t('meeting.participants')
        },
        {
          name: 'invites',
          title: t('meeting.invites.invites')
        },
        {
          name: 'groups',
          title: t('meeting.groups.groups')
        }
      ]
    })
    watch(currentTab, (value) => {
      if (value === 'invites') meetingInviteType.channel.subscribe(meetingId.value)
      else meetingInviteType.channel.leave(meetingId.value)
    })

    /* INVITES */
    // const inviteRoles = computed(() => getRoleLabels())
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
    const submittingInvitations = ref(false)
    const invitationsReady = computed(() => !submittingInvitations.value && checkInviteData())
    const invitationDialogOpen = ref(false)
    const inviteErrors = ref<Record<string, string[]>>({})
    async function submitInvitations () {
      inviteErrors.value = {}
      submittingInvitations.value = true
      try {
        await meetingInviteType.channel.post('invites.add', {
          invite_data: inviteData.invite_data.split('\n'),
          meeting: meetingId.value,
          roles: inviteData.roles
        }, { alertOnError: false })
        invitationDialogOpen.value = false
        inviteData.invite_data = ''
        inviteData.roles = ['participant']
      } catch (e) {
        inviteErrors.value = parseSocketError(e as Error)
      }
      submittingInvitations.value = false
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
      exactRoles: false
    })
    const filteredInvites = computed(() => {
      const roleSet = new Set(inviteFilter.roles)
      const filter = inviteFilter.exactRoles
        ? (invite: MeetingInvite) => isEqual(roleSet, new Set(invite.roles))
        : (invite: MeetingInvite) => inviteFilter.roles.every((role) => invite.roles.includes(role as MeetingRole))
      return meetingInvites.value
        .filter(filter)
    })

    function copyFilteredData () {
      copy(filteredInvites.value.map(i => i.invite_data).join('\n') + '\n')
    }

    /* Groups */
    // function sleep (ms: number) {
    //   return new Promise((resolve) => {
    //     setTimeout(resolve, ms)
    //   })
    // }
    const groupSchema = [
      {
        name: 'title',
        type: 'text',
        label: t('name'),
        rules: [required]
      }
    ]
    async function createGroup (data: Partial<MeetingGroup>) {
      // await sleep(3000)
      if (!user.value) throw new Error('User not authenticated')
      await meetingGroupType.api.add({
        ...data,
        meeting: meetingId.value,
        // body: '',
        // tags: [],
        members: [user.value.pk]
      })
    }
    function changeGroup (pk: number) {
      return (data: Partial<MeetingGroup>) => meetingGroupType.api.patch(pk, data)
    }
    async function deleteGroup (group: MeetingGroup) {
      if (!await dialogQuery({
        title: t('meeting.groups.deleteConfirm', { ...group }),
        theme: ThemeColor.Warning
      })) return false
      try {
        await meetingGroupType.api.delete(group.pk)
        return true
      } catch {
        return false
      }
    }

    return {
      t,
      canChangeRoles,
      copied,
      currentTab,
      filterMenu: ref(false),
      filteredInvites,
      groupSchema,
      invitationDialogOpen,
      inviteData,
      inviteErrors,
      inviteFilter,
      roleLabels,
      meetingChannel: meetingType.channel,
      meetingGroups,
      meetingIcons,
      meetingId,
      meetingInvites,
      invitationsReady,
      tabs,
      addUser,
      copyFilteredData,
      changeGroup,
      createGroup,
      deleteGroup,
      getRoleIcon,
      getTypeIcon,
      getUserIds,
      removeConfirm,
      searchFilter,
      submitInvitations
    }
  },
  components: {
    CheckboxMultipleSelect,
    RoleMatrix,
    UserSearch,
    Tabs,
    SchemaForm,
    UserList
  }
})
</script>
