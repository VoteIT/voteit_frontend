<template>
  <div>
    <v-alert type="info" class="mb-4">
      {{ t('meeting.groups.help') }}
    </v-alert>
    <v-toolbar :title="t('meeting.groups.groups')" color="secondary">
      <template v-if="canChangeMeeting">
        <DefaultDialog :title="t('meeting.groups.import')">
          <template #activator="{ props }">
            <v-btn prepend-icon="mdi-file-import" v-bind="props">
              {{ t('meeting.groups.import') }}
            </v-btn>
          </template>
          <template #default="{ close }">
            <v-alert type="info" class="mb-2" :text="meeting?.group_votes_active ? t('meeting.groups.importWithVotesHelp') : t('meeting.groups.importHelp')" />
            <SchemaForm
             :schema="importSchema"
             :handler="createGroups"
             @saved="close"
            >
              <template #buttons="{ disabled, submitting }">
                <div class="text-right">
                  <v-btn type="submit" color="primary" :loading="submitting" :disabled="disabled" prepend-icon="mdi-send">
                    {{ t('meeting.groups.import') }}
                  </v-btn>
                </div>
              </template>
            </SchemaForm>
          </template>
        </DefaultDialog>
        <v-menu v-if="meetingGroups.length">
          <template #activator="{ props }">
            <v-btn prepend-icon="mdi-download" v-bind="props">
              {{ t('download') }}
            </v-btn>
          </template>
          <v-list>
            <v-list-item append-icon="mdi-file-download" :title="t('meeting.groups.groups') + ' (CSV)'" :href="getApiLink(`export-meeting-groups/${meetingId}/csv/`)" />
            <v-list-item append-icon="mdi-file-download" :title="t('meeting.groups.groups') + ' (JSON)'" :href="getApiLink(`export-meeting-groups/${meetingId}/json/`)" />
          </v-list>
        </v-menu>
        <DefaultDialog :title="t('meeting.groups.new')">
          <template #activator="{ props }">
            <v-btn prepend-icon="mdi-account-multiple-plus" v-bind="props">
              {{ t('meeting.groups.create') }}
            </v-btn>
          </template>
          <template #default="{ close }">
            <SchemaForm
              :schema="groupSchema"
              :handler="createGroup"
              @saved="close"
            >
              <template #buttons="{ disabled, submitting }">
                <div class="text-right">
                  <v-btn variant="text" @click="close">
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
      </template>
    </v-toolbar>
    <v-table>
      <thead>
        <tr>
          <th>
            {{ t('name') }}
          </th>
          <th>
            {{ t('meeting.groups.members') }}
          </th>
          <th v-for="{ description, name, title } in columns" :key="name" class="text-truncate">
            <span>
              {{ title }}
            </span>
            <v-tooltip v-if="description" :text="description" location="top">
              <template #activator="{ props }">
                <v-icon icon="mdi-help-circle" v-bind="props" class="ml-1 my-n2" />
              </template>
            </v-tooltip>
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
              <template #default="{ close }">
                <SchemaForm
                  :schema="groupSchema"
                  :handler="changeGroup(group.pk)"
                  :modelValue="{ title: group.title, votes: group.votes || 0 }"
                  @saved="close"
                >
                  <template #buttons="{ disabled, submitting }">
                    <div class="text-right">
                      <v-btn @click="close" variant="text">
                        {{ t('cancel') }}
                      </v-btn>
                      <QueryDialog :text="t('meeting.groups.deleteConfirm', { ...group })" color="warning" @confirmed="deleteGroup(group, close)">
                        <template #activator="{ props }">
                          <v-btn variant="text" color="warning" v-bind="props">
                            {{ t('content.delete') }}
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
      <tfoot v-if="hasCountColumns">
        <tr>
          <th>{{ t('total') }}</th>
          <th></th>
          <th v-for="{ name, getCount } in columns" :key="name">
            {{ getCount?.() || '-' }}
          </th>
          <th></th>
        </tr>
      </tfoot>
    </v-table>
  </div>
</template>

<script lang="ts" setup>
import { any } from 'itertools'
import { computed } from 'vue'
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
import useErrorHandler from '@/composables/useErrorHandler'
import { getApiLink } from '@/utils/restApi'

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
const hasCountColumns = computed(() => any(columns.value, c => !!c.getCount))

const importSchema = computed<FormSchema>(() => {
  const validate = rules.multiline(
    rules.or(
      rules.tabSeparated(rules.minLength(1), rules.minLength(1)),
      rules.tabSeparated(rules.minLength(1), rules.minLength(1), rules.min(0))
    )
  )
  return [
    {
      label: t('meeting.groups.groups'),
      name: 'groups',
      type: FieldType.TextArea,
      rules: [{
        props: {
          required: true
        },
        validate
      }]
    }
  ]
})
/**
 * Socket call to import groups.
 */
function createGroups (data: { groups: string }) {
  return meetingGroupType.methodCall('bulk_create', {
    meeting: meetingId.value,
    ...data
  })
}

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

const { handleRestError } = useErrorHandler({ target: 'alert' })
async function deleteGroup (group: MeetingGroup, close: () => void) {
  try {
    await meetingGroupType.api.delete(group.pk)
    close()
  } catch (e) {
    handleRestError(e)
  }
}
</script>
