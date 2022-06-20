<template>
  <div>
    <v-alert type="info" class="mb-4">
      {{ t('meeting.groups.help') }}
    </v-alert>
    <div class="d-flex mb-4">
      <h1>
        {{ t('meeting.groups.groups') }}
      </h1>
      <v-spacer />
      <v-dialog v-if="canChangeMeeting">
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
              <template #buttons="{ disabled, submitting }">
                <div class="text-right">
                  <v-btn variant="text" @click="isActive.value = false">
                    {{ t('cancel') }}
                  </v-btn>
                  <v-btn type="submit" color="primary" :loading="submitting" :disabled="disabled" prepend-icon="mdi-account-multiple-plus">
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
          <th :colspan="canChangeMeeting ? 2 : 1">
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
          <td class="text-right" v-if="canChangeMeeting">
            <v-dialog>
              <template #activator="{ props }">
                <v-btn size="small" color="primary" v-bind="props">
                  {{ t('edit') }}
                </v-btn>
              </template>
              <template #default="{ isActive }">
                <v-sheet rounded class="pa-4" v-bind="dialogDefaults">
                  <h2 class="mb-2">
                    {{ t('meeting.groups.modify') }}
                  </h2>
                  <SchemaForm :schema="groupSchema" :handler="changeGroup(group.pk)" :modelValue="{ title: group.title }" @saved="isActive.value = false">
                    <template #buttons="{ disabled, submitting }">
                      <div class="text-right">
                        <v-btn @click="isActive.value = false" variant="text">
                          {{ t('cancel') }}
                        </v-btn>
                        <v-btn @click="deleteGroup(group).then((done) => { isActive.value = !done })" variant="text" color="warning">
                          {{ t('delete') }}
                        </v-btn>
                        <v-btn type="submit" color="primary" :loading="submitting" :disabled="disabled">
                          {{ t('save') }}
                        </v-btn>
                      </div>
                    </template>
                  </SchemaForm>
                  <v-divider class="my-4" />
                  <h2 class="mb-2">
                    {{ t('meeting.groups.members') }}
                  </h2>
                  <UserSearch
                    v-model="addUser" :params="{ meeting: meetingId }"
                    :filter="(user) => !group.members.includes(user.pk)"
                    :label="t('meeting.groups.addMember')"
                    @submit="addMember(group, $event)" instant
                  />
                  <v-list v-if="group.members.length">
                    <v-list-item
                      v-for="user in getMembers(group)" :key="user.pk"
                    >
                      <v-list-item-avatar class="mr-2">
                        <UserAvatar :pk="user.pk" />
                      </v-list-item-avatar>
                      <v-list-item-header>
                        <v-list-item-title :class="{ 'text-secondary': !user.full_name }">
                          {{ user.full_name ?? `- ${t('unknownUser')} -` }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                          {{ user.userid }}
                        </v-list-item-subtitle>
                      </v-list-item-header>
                      <v-btn icon="mdi-close" color="secondary" variant="text" @click="removeMember(group, user)" />
                    </v-list-item>
                  </v-list>
                  <v-alert v-else type="info" :text="t('meeting.groups.addMemberEmptyHelp')" class="mt-4" />
                </v-sheet>
              </template>
            </v-dialog>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { required } from '@/utils/rules'
import { ThemeColor } from '@/utils/types'
import UserSearch from '@/components/UserSearch.vue'
import SchemaForm from '@/components/SchemaForm.vue'
import UserList from '@/components/UserList.vue'
import useAuthentication from '@/composables/useAuthentication'

import useMeeting from './useMeeting'

import useMeetingGroups from './useMeetingGroups'
import { meetingGroupType, meetingType } from './contentTypes'
import { MeetingGroup } from './types'
import useDefaults from '@/composables/useDefaults'
import { User } from '../organisations/types'
import useUserDetails from '../organisations/useUserDetails'

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const { meetingId } = useMeeting()
    const { getUser } = useUserDetails()
    const { meetingGroups, canChangeMeeting } = useMeetingGroups(meetingId)
    const { user } = useAuthentication()

    const groupSchema = [
      {
        name: 'title',
        type: 'text',
        label: t('name'),
        rules: [required]
      }
    ]
    async function createGroup (data: Partial<MeetingGroup>) {
      if (!user.value) throw new Error('User not authenticated')
      await meetingGroupType.api.add({
        ...data,
        meeting: meetingId.value
        // body: '',
        // tags: [],
        // members: []
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

    const addUser = ref(null)
    function getMembers (group: MeetingGroup) {
      return group.members.map(pk => getUser(pk) ?? { pk })
    }
    function addMember (group: MeetingGroup, user: User) {
      meetingGroupType.api.patch(group.pk, { members: [...group.members, user.pk] })
    }
    function removeMember (group: MeetingGroup, user: User) {
      meetingGroupType.api.patch(group.pk, { members: group.members.filter(pk => pk !== user.pk) })
    }

    return {
      t,
      ...useDefaults(),
      addUser,
      canChangeMeeting,
      groupSchema,
      meetingId,
      meetingType,
      meetingGroups,
      addMember,
      changeGroup,
      createGroup,
      deleteGroup,
      getMembers,
      removeMember
    }
  },
  components: {
    UserSearch,
    SchemaForm,
    UserList
  }
})
</script>
