<template>
  <div>
    <v-alert type="info" class="mb-4">
      {{ t('meeting.groups.help') }}
    </v-alert>
    <v-toolbar :title="t('meeting.groups.groups')" color="secondary">
      <v-btn
        class="mr-2 d-none d-md-inline"
        :variant="groupFilter.open ? 'elevated' : 'text'"
        @click="groupFilter.open = !groupFilter.open"
        :color="groupFilter.open ? 'secondary-lighten-2' : undefined"
      >
        <v-icon start>mdi-filter-menu</v-icon>
        {{ t('filter') }}
      </v-btn>
      <template v-if="canChangeMeeting">
        <DefaultDialog :title="t('meeting.groups.import')">
          <template #activator="{ props }">
            <v-btn prepend-icon="mdi-file-import" v-bind="props">
              {{ t('meeting.groups.import') }}
            </v-btn>
          </template>
          <template #default="{ close }">
            <v-alert
              type="info"
              class="mb-2"
              :text="
                meeting?.group_votes_active
                  ? t('meeting.groups.importWithVotesHelp')
                  : t('meeting.groups.importHelp')
              "
            />
            <SchemaForm
              :schema="importSchema"
              :handler="createGroups"
              @saved="close"
            >
              <template #buttons="{ disabled, submitting }">
                <div class="text-right">
                  <v-btn
                    type="submit"
                    color="primary"
                    :loading="submitting"
                    :disabled="disabled"
                    prepend-icon="mdi-send"
                  >
                    {{ t('meeting.groups.import') }}
                  </v-btn>
                </div>
              </template>
            </SchemaForm>
          </template>
        </DefaultDialog>
        <v-menu v-if="orderedMeetingGroups.length">
          <template #activator="{ props }">
            <v-btn prepend-icon="mdi-download" v-bind="props">
              {{ t('download') }}
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              append-icon="mdi-file-download"
              :title="t('meeting.groups.groups') + ' (CSV)'"
              :href="getApiLink(`export-meeting-groups/${meetingId}/csv/`)"
            />
            <v-list-item
              append-icon="mdi-file-download"
              :title="t('meeting.groups.groups') + ' (JSON)'"
              :href="getApiLink(`export-meeting-groups/${meetingId}/json/`)"
            />
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
                  <v-btn
                    type="submit"
                    color="primary"
                    :loading="submitting"
                    :disabled="disabled"
                    prepend-icon="mdi-account-multiple-plus"
                  >
                    {{ t('meeting.groups.create') }}
                  </v-btn>
                </div>
              </template>
            </SchemaForm>
          </template>
        </DefaultDialog>
      </template>
    </v-toolbar>
    <v-expand-transition>
      <v-sheet v-show="groupFilter.open" color="secondary" class="rounded-b">
        <div class="pa-4">
          <v-text-field
            :label="t('search')"
            v-model="groupFilter.search"
            clearable
          />
          <v-switch
            :label="t('meeting.groups.filterMine')"
            hide-details
            v-model="groupFilter.mine"
          />
        </div>
      </v-sheet>
    </v-expand-transition>
    <v-pagination
      v-if="groupChunks.length > 1"
      v-model="currentPage"
      :length="groupChunks.length"
    />
    <v-table>
      <thead>
        <tr>
          <th>
            {{ t('name') }}
          </th>
          <th>
            {{ t('meeting.groups.members') }}
          </th>
          <th v-for="sw in groupSwitches" :key="sw.prop">
            {{ sw.title }}
            <v-tooltip :text="sw.description" location="top">
              <template #activator="{ props }">
                <v-icon
                  icon="mdi-help-circle"
                  v-bind="props"
                  class="ml-1 my-n2"
                />
              </template>
            </v-tooltip>
          </th>
          <th
            v-for="{ description, name, title } in columns"
            :key="name"
            class="text-truncate"
          >
            <span>
              {{ title }}
            </span>
            <v-tooltip v-if="description" :text="description" location="top">
              <template #activator="{ props }">
                <v-icon
                  icon="mdi-help-circle"
                  v-bind="props"
                  class="ml-1 my-n2"
                />
              </template>
            </v-tooltip>
          </th>
          <th v-if="allTags.size">
            {{ t('tags') }}
          </th>
          <th v-if="canChangeMeeting"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="group in groupChunks[currentPage - 1]"
          :key="group.pk"
          :class="group.isMember ? 'bg-secondary-lighten-2' : undefined"
        >
          <td>
            {{ group.title }}
          </td>
          <td>
            {{ group.members.length || '-' }}
            <DefaultDialog
              v-if="group.members.length || canChangeMeeting"
              :title="t('meeting.groups.membersIn', { ...group })"
            >
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="small"
                  color="secondary"
                  class="ml-2"
                >
                  {{ canChangeMeeting ? t('handle') : t('show') }}
                </v-btn>
              </template>
              <GroupMemberships :group="group" :editable="canChangeMeeting" />
            </DefaultDialog>
          </td>
          <th v-for="{ prop } in groupSwitches" :key="prop">
            <v-btn
              variant="text"
              size="small"
              @click="toggleGroupProp(group, prop)"
            >
              <v-icon
                :icon="group[prop] ? 'mdi-check' : 'mdi-close'"
                :color="group[prop] ? 'success' : 'warning'"
              />
            </v-btn>
          </th>
          <td v-for="{ component, name, getValue } in columns" :key="name">
            {{ getValue?.(group) }}
            <component v-if="component" :is="component" :group="group" />
          </td>
          <td v-if="allTags.size">
            <Tag
              v-for="tag in group.tags"
              :key="tag"
              :name="tag"
              class="mr-1"
            />
          </td>
          <td class="text-right" v-if="canChangeMeeting">
            <DefaultDialog>
              <template #activator="{ props }">
                <ButtonWithDropdown
                  color="primary"
                  size="small"
                  :text="t('edit')"
                  v-bind="props"
                >
                  <v-list density="compact">
                    <QueryDialog
                      :text="t('meeting.groups.deleteConfirm', { ...group })"
                      color="warning"
                      @confirmed="deleteGroup(group)"
                    >
                      <template #activator="{ props }">
                        <v-list-item
                          base-color="warning"
                          v-bind="props"
                          :title="t('content.delete')"
                        />
                      </template>
                    </QueryDialog>
                  </v-list>
                </ButtonWithDropdown>
              </template>
              <template #default="{ close }">
                <SchemaForm
                  :schema="groupSchema"
                  :handler="changeGroup(group.pk)"
                  :modelValue="{ ...group }"
                  @saved="close"
                >
                  <template #buttons="{ disabled, submitting }">
                    <div class="text-right">
                      <v-btn @click="close" variant="text">
                        {{ t('cancel') }}
                      </v-btn>
                      <v-btn
                        type="submit"
                        color="primary"
                        :loading="submitting"
                        :disabled="disabled"
                      >
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
          <th v-if="allTags.size"></th>
          <th v-if="canChangeMeeting"></th>
        </tr>
      </tfoot>
    </v-table>
  </div>
</template>

<script lang="ts" setup>
import { any, flatmap } from 'itertools'
import { chunk, orderBy } from 'lodash'
import { computed, provide, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { getApiLink } from '@/utils/restApi'
import SchemaForm from '@/components/SchemaForm.vue'
import Tag from '@/components/Tag.vue'
import useAuthentication from '@/composables/useAuthentication'
import DefaultDialog from '@/components/DefaultDialog.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import ButtonWithDropdown from '@/components/ButtonWithDropdown.vue'
import useRules from '@/composables/useRules'
import useErrorHandler from '@/composables/useErrorHandler'
import { FieldType, FormSchema } from '@/components/types'

import useMeeting from './useMeeting'

import useMeetingGroups from './useMeetingGroups'
import { meetingGroupType } from './contentTypes'
import { MeetingGroup, MeetingGroupColumn } from './types'
import GroupMemberships from './GroupMemberships.vue'
import { meetingGroupTablePlugins } from './registry'
import useTags, { TagsKey } from './useTags'
import useUserDetails from '../organisations/useUserDetails'
import { getFullName } from '@/utils'
import { PickByType } from '@/utils/types'

const { t } = useI18n()
const { meeting, meetingId } = useMeeting()
const { meetingGroups, canChangeMeeting } = useMeetingGroups(meetingId)
const { user } = useAuthentication()
const { getUser } = useUserDetails()
const rules = useRules(t)

const groupFilter = reactive<{
  mine: boolean
  open: boolean
  search: string | null
}>({
  mine: false,
  open: false,
  search: null
})

// Set search query on tag click
function tagClick(tag: string) {
  groupFilter.open = true
  groupFilter.search = '#' + tag
}
useTags(undefined, tagClick)

function searchGroup({
  tags,
  title,
  members
}: (typeof meetingGroups.value)[number]) {
  if (!groupFilter.search) return true
  const query = groupFilter.search.toLowerCase()
  // Start by title search (cheapest)
  if (title.toLowerCase().includes(query)) return true
  // Tags are always lowercase
  if (tags.some((tag) => ('#' + tag).includes(query))) return true
  // Lastly, search members
  return members.some((id) => {
    const user = getUser(id)
    if (!user) return false
    return (
      !!user.userid?.includes(query) ||
      getFullName(user).toLowerCase().includes(query)
    )
  })
}

const orderedMeetingGroups = computed(() => {
  return orderBy(
    meetingGroups.value
      .map((g) => ({
        ...g,
        isMember: g.members.includes(user.value!.pk)
      }))
      .filter((g) => {
        if (groupFilter.mine && !g.isMember) return false
        if (groupFilter.search && !searchGroup(g)) return false
        return true
      }),
    'isMember',
    'desc'
  )
})

const columns = computed(() => {
  if (!meeting.value) return []
  const plugins = meetingGroupTablePlugins.getActivePlugins(meeting.value)
  let columns: MeetingGroupColumn[] = []
  for (const plugin of plugins) {
    columns = plugin.transform(columns, meeting.value)
  }
  return columns.map((col) => ({
    ...col,
    count: col.getCount?.(),
    description: col.getDescription?.(t),
    title: col.getTitle(t)
  }))
})
const hasCountColumns = computed(() => any(columns.value, (c) => !!c.getCount))

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
      rules: [
        {
          props: {
            required: true
          },
          validate
        }
      ]
    }
  ]
})
/**
 * Socket call to import groups.
 */
async function createGroups(data: { groups: string }) {
  await meetingGroupType.methodCall('bulk_create', {
    meeting: meetingId.value,
    ...data
  })
}

// Paginate
const GROUPS_PER_PAGE = 20
const currentPage = ref(1)
const groupChunks = computed(() =>
  chunk(orderedMeetingGroups.value, GROUPS_PER_PAGE)
)
watch(groupChunks, (chunks) => {
  const maxPage = chunks.length + 1
  if (currentPage.value > maxPage) currentPage.value = maxPage
})

// Provide tag autocompletion
const allTags = computed(
  () => new Set(flatmap(meetingGroups.value, (group) => group.tags))
)
provide(TagsKey, allTags)

const groupSchema = computed(() => {
  const schema: FormSchema = [
    {
      name: 'title',
      type: FieldType.Text,
      label: t('name'),
      rules: [
        {
          props: {
            maxlength: 100,
            required: true
          },
          validate: rules.required
        }
      ]
    },
    {
      name: 'body',
      type: FieldType.TextArea,
      label: t('textBody')
    },
    {
      name: 'tags',
      type: FieldType.Tags,
      label: t('tags')
    }
  ]
  if (meeting.value?.group_votes_active) {
    schema.push({
      name: 'votes',
      type: FieldType.Number,
      label: t('meeting.groups.votes'),
      rules: [
        {
          props: {
            min: 0
          },
          validate: rules.min(0)
        }
      ]
    })
  }
  return schema
})

async function createGroup(data: Partial<MeetingGroup>) {
  if (!user.value) throw new Error('User not authenticated')
  await meetingGroupType.api.add({
    ...data,
    meeting: meetingId.value
    // body: '',
    // tags: [],
  })
}

function changeGroup(pk: number) {
  return (data: Partial<MeetingGroup>) => meetingGroupType.api.patch(pk, data)
}

const { handleRestError } = useErrorHandler({ target: 'dialog' })
async function deleteGroup(group: MeetingGroup) {
  try {
    await meetingGroupType.api.delete(group.pk)
  } catch (e) {
    handleRestError(e)
  }
}

/**
 * Switches to handle group settings for post_as, etc
 */
type GroupBoolean = keyof PickByType<MeetingGroup, boolean>

const groupSwitches = computed<
  {
    description: string
    prop: GroupBoolean
    title: string
  }[]
>(() => {
  if (!canChangeMeeting.value) return []
  return [
    {
      description: t('meeting.groups.showOnSpeakerDescription'),
      prop: 'show_on_speaker',
      title: t('meeting.groups.showOnSpeaker')
    },
    {
      description: t('meeting.groups.postAsDescription'),
      prop: 'post_as',
      title: t('meeting.groups.postAs')
    }
  ]
})

async function toggleGroupProp(group: MeetingGroup, prop: GroupBoolean) {
  const patchData: Partial<MeetingGroup> = {}
  patchData[prop] = !group[prop]
  try {
    await meetingGroupType.api.patch(group.pk, patchData)
  } catch (e) {
    handleRestError(e, prop)
  }
}
</script>
