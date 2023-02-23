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
      <DefaultDialog v-if="canChangeMeeting" :title="t('meeting.groups.new')">
        <template #activator="{ props }">
          <v-btn color="primary" prepend-icon="mdi-account-multiple-plus" v-bind="props">
            {{ t('meeting.groups.create') }}
          </v-btn>
        </template>
        <template #default="{ isActive }">
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
        </template>
      </DefaultDialog>
    </div>
    <v-table>
      <thead>
        <tr>
          <th>
            {{ t('name') }}
          </th>
          <th>
            {{ t('meeting.groups.members') }}
          </th>
          <th v-for="{ description, name, title } in columns" :key="name">
            <v-tooltip v-if="description" :text="description" location="top">
              <template #activator="{ props }">
                <span v-bind="props">
                  {{ title }}
                </span>
              </template>
            </v-tooltip>
            <span v-else>
              {{ title }}
            </span>
          </th>
          <th v-if="canChangeMeeting"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="group in meetingGroups" :key="group.pk">
          <td>
            {{ group.title }}
          </td>
          <td>
            {{ group.members.length || '-' }}
            <DefaultDialog v-if="group.members.length || canChangeMeeting" :title="t('meeting.groups.membersIn', { ...group })">
              <template #activator="{ props }">
                <v-btn v-bind="props" size="small" color="secondary" class="ml-2">
                  {{ canChangeMeeting ? t('handle') : t('show') }}
                </v-btn>
              </template>
              <GroupMemberships
                :group="group.pk"
                :members="group.memberships"
                :editable="canChangeMeeting"
              />
            </DefaultDialog>
          </td>
          <td v-for="{ component, name, getValue } in columns" :key="name">
            {{ getValue?.(group) }}
            <component v-if="component" :is="component" :group="group" />
          </td>
          <td class="text-right" v-if="canChangeMeeting">
            <DefaultDialog>
              <template #activator="{ props }">
                <v-btn size="small" color="primary" v-bind="props">
                  {{ t('edit') }}
                </v-btn>
              </template>
              <template #default="{ isActive }">
                <SchemaForm :schema="groupSchema" :handler="changeGroup(group.pk)" :modelValue="{ title: group.title, votes: group.votes || 0 }" @saved="isActive.value = false">
                  <template #buttons="{ disabled, submitting }">
                    <div class="text-right">
                      <v-btn @click="isActive.value = false" variant="text">
                        {{ t('cancel') }}
                      </v-btn>
                      <QueryDialog :text="t('meeting.groups.deleteConfirm', { ...group })" color="warning" @confirmed="deleteGroup(group, isActive)">
                        <template #activator="{ props }">
                          <v-btn variant="text" color="warning" v-bind="props">
                            {{ t('delete') }}
                          </v-btn>
                        </template>
                      </QueryDialog>
                      <v-btn type="submit" color="primary" :loading="submitting" :disabled="disabled">
                        {{ t('save') }}
                      </v-btn>
                    </div>
                  </template>
                </SchemaForm>
              </template>
            </DefaultDialog>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script lang="ts" setup>
import { computed, Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import SchemaForm from '@/components/SchemaForm.vue'
import useAuthentication from '@/composables/useAuthentication'
import DefaultDialog from '@/components/DefaultDialog.vue'
import QueryDialog from '@/components/QueryDialog.vue'

import useMeeting from './useMeeting'

import useMeetingGroups from './useMeetingGroups'
import { meetingGroupType } from './contentTypes'
import { MeetingGroup, MeetingGroupColumn } from './types'
import { FieldType, FormSchema } from '@/components/types'
import GroupMemberships from './GroupMemberships.vue'
import useRules from '@/composables/useRules'
import { meetingGroupTablePlugins } from './registry'

const { t } = useI18n()
const { meeting, meetingId } = useMeeting()
const { meetingGroups, canChangeMeeting } = useMeetingGroups(meetingId)
const { user } = useAuthentication()
const rules = useRules(t)

const columns = computed(() => {
  if (!meeting.value) return []
  const plugins = meetingGroupTablePlugins.getActivePlugins(meeting.value)
  let columns: MeetingGroupColumn[] = []
  for (const plugin of plugins) {
    columns = plugin.transform(columns, meeting.value)
  }
  return columns.map(col => ({
    ...col,
    count: col.getCount?.(),
    description: col.getDescription?.(t),
    title: col.getTitle(t)
  }))
})

const groupSchema = computed(() => {
  const schema: FormSchema = [{
    name: 'title',
    type: FieldType.Text,
    label: t('name'),
    rules: [{
      props: {
        maxlength: 100,
        required: true
      },
      validate: rules.required
    }]
  }]
  if (meeting.value?.group_votes_active) {
    schema.push({
      name: 'votes',
      type: FieldType.Number,
      label: t('meeting.groups.votes'),
      rules: [{
        props: {
          min: 0
        },
        validate: rules.min(0)
      }]
    })
  }
  return schema
})

async function createGroup (data: Partial<MeetingGroup>) {
  if (!user.value) throw new Error('User not authenticated')
  await meetingGroupType.api.add({
    ...data,
    meeting: meetingId.value
    // body: '',
    // tags: [],
  })
}

function changeGroup (pk: number) {
  return (data: Partial<MeetingGroup>) => meetingGroupType.api.patch(pk, data)
}

async function deleteGroup (group: MeetingGroup, isActive: Ref<boolean>) {
  try {
    await meetingGroupType.api.delete(group.pk)
    isActive.value = false
  } catch {
    alert("Couldn't delete group")
  }
}
</script>
