<script lang="ts" setup>
import { flatmap, sorted } from 'itertools'
import { computed, provide, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import { getFullName } from '@/utils'
import { PickByType } from '@/utils/types'
import { getApiLink } from '@/utils/restApi'
import Tag from '@/components/Tag.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import ButtonWithDropdown from '@/components/ButtonWithDropdown.vue'
import useRules from '@/composables/useRules'
import useErrorHandler from '@/composables/useErrorHandler'
import DefaultForm from '@/components/DefaultForm.vue'
import TagEdit from '@/components/TagEdit.vue'

import useAuthStore from '../auth/useAuthStore'
import useUserDetails from '../organisations/useUserDetails'

import useMeeting from './useMeeting'
import useMeetingGroups from './useMeetingGroups'
import { meetingGroupType } from './contentTypes'
import { MeetingGroup, MeetingGroupColumn } from './types'
import GroupMemberships from './GroupMemberships.vue'
import { meetingGroupTablePlugins } from './registry'
import { TagClickHandlerKey, TagsKey } from './useTags'

const { t } = useI18n()
const { meeting, meetingId } = useMeeting()
const { meetingGroups, canChangeMeeting } = useMeetingGroups(meetingId)
const authStore = useAuthStore()
const { getUser } = useUserDetails(meetingId)
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
provide(TagClickHandlerKey, (tag) => {
  groupFilter.open = true
  groupFilter.search = '#' + tag
})

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
  return sorted(
    meetingGroups.value.map((g) => ({
      ...g,
      isMember: g.members.includes(authStore.user!.pk)
    })),
    (mg) => mg.isMember,
    true // Reversed
  )
})

function customFilter(_value: unknown, _query: string, item: any) {
  const g = item.raw as (typeof orderedMeetingGroups)['value'][number]
  const { mine, search } = groupFilter
  if (mine && !g.isMember) return false
  return !search || searchGroup(g)
}

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
const ITEMS_PER_PAGE = 20

const headers = computed(() => {
  const h: { title: string; key: string; sortable: boolean }[] = [
    { title: t('name'), key: 'title', sortable: true },
    { title: t('meeting.groups.members'), key: 'members', sortable: false },
    ...groupSwitches.value.map((sw) => ({
      title: '',
      key: sw.prop,
      sortable: false
    })),
    ...columns.value.map((col) => ({
      title: '',
      key: col.name,
      sortable: false
    }))
  ]
  if (allTags.value.size)
    h.push({ title: t('tags'), key: 'tags', sortable: false })
  if (canChangeMeeting.value)
    h.push({ title: '', key: 'actions', sortable: false })
  return h
})

const groupImportMultiline = rules.multiline(
  rules.or(
    rules.tabSeparated(rules.minLength(1), rules.minLength(1)),
    rules.tabSeparated(rules.minLength(1), rules.minLength(1), rules.min(0))
  )
)

/**
 * Socket call to import groups.
 */
async function createGroups(data: { groups: string }) {
  await meetingGroupType.methodCall('bulk_create', {
    meeting: meetingId.value,
    ...data
  })
}

// Provide tag autocompletion
const allTags = computed(
  () => new Set(flatmap(meetingGroups.value, (group) => group.tags))
)
provide(TagsKey, allTags)

async function createGroup(data: Partial<MeetingGroup>) {
  if (!authStore.user) throw new Error('User not authenticated')
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

<template>
  <div>
    <v-alert type="info" class="mb-4">
      {{ $t('meeting.groups.help') }}
    </v-alert>
    <v-toolbar :title="$t('meeting.groups.groups')" color="secondary">
      <v-btn
        class="mr-2 d-none d-md-inline"
        :variant="groupFilter.open ? 'elevated' : 'text'"
        @click="groupFilter.open = !groupFilter.open"
        :color="groupFilter.open ? 'secondary-lighten-2' : undefined"
      >
        <v-icon start>mdi-filter-menu</v-icon>
        {{ $t('filter') }}
      </v-btn>
      <template v-if="canChangeMeeting">
        <DefaultDialog :title="$t('meeting.groups.import')">
          <template #activator="{ props }">
            <v-btn
              prepend-icon="mdi-file-import"
              :text="$t('meeting.groups.import')"
              v-bind="props"
            />
          </template>
          <template #default="{ close }">
            <v-alert
              type="info"
              class="mb-2"
              :text="
                meeting?.group_votes_active
                  ? $t('meeting.groups.importWithVotesHelp')
                  : $t('meeting.groups.importHelp')
              "
            />
            <DefaultForm
              :handler="createGroups"
              :modelValue="{ groups: '' }"
              @done="close"
            >
              <template #default="{ errors, formData }">
                <v-textarea
                  :label="$t('meeting.groups.groups')"
                  :error-messages="errors.groups"
                  :rules="[rules.required, groupImportMultiline]"
                  v-model="formData.groups"
                />
              </template>
              <template #buttons="{ disabled, submitting }">
                <div class="text-right">
                  <v-btn
                    color="primary"
                    :disabled="disabled"
                    :loading="submitting"
                    prepend-icon="mdi-send"
                    :text="$t('meeting.groups.import')"
                    type="submit"
                  />
                </div>
              </template>
            </DefaultForm>
          </template>
        </DefaultDialog>
        <v-menu v-if="orderedMeetingGroups.length">
          <template #activator="{ props }">
            <v-btn
              prepend-icon="mdi-download"
              :text="$t('download')"
              v-bind="props"
            />
          </template>
          <v-list>
            <v-list-item
              append-icon="mdi-file-download"
              :title="$t('meeting.groups.groups') + ' (CSV)'"
              :href="getApiLink(`export-meeting-groups/${meetingId}/csv/`)"
            />
            <v-list-item
              append-icon="mdi-file-download"
              :title="$t('meeting.groups.groups') + ' (JSON)'"
              :href="getApiLink(`export-meeting-groups/${meetingId}/json/`)"
            />
          </v-list>
        </v-menu>
        <DefaultDialog :title="$t('meeting.groups.new')">
          <template #activator="{ props }">
            <v-btn
              prepend-icon="mdi-account-multiple-plus"
              :text="$t('meeting.groups.create')"
              v-bind="props"
            />
          </template>
          <template #default="{ close }">
            <DefaultForm
              :handler="createGroup"
              :model-value="{ title: '', body: '', tags: [], votes: null }"
              :saveText="$t('meeting.groups.create')"
              v-slot="{ errors, formData }"
              @done="close"
            >
              <v-text-field
                :error-messages="errors.title"
                :label="$t('name')"
                :rules="[rules.maxLength(100), rules.required]"
                v-model="formData.title"
              />
              <v-textarea
                :error-messages="errors.body"
                :label="$t('textBody')"
                v-model="formData.body"
              />
              <TagEdit :label="$t('tags')" v-model="formData.tags" />
              <v-text-field
                v-if="meeting?.group_votes_active"
                :error-messages="errors.votes"
                :label="$t('meeting.groups.votes')"
                min="0"
                :rules="[rules.min(0)]"
                type="number"
                v-model="formData.votes"
              />
            </DefaultForm>
          </template>
        </DefaultDialog>
      </template>
    </v-toolbar>
    <v-expand-transition>
      <v-sheet v-show="groupFilter.open" color="secondary" class="rounded-b">
        <div class="pa-4">
          <v-text-field
            :label="$t('search')"
            v-model="groupFilter.search"
            clearable
          />
          <v-switch
            :label="$t('meeting.groups.filterMine')"
            hide-details
            v-model="groupFilter.mine"
          />
        </div>
      </v-sheet>
    </v-expand-transition>
    <v-data-table
      :custom-filter="customFilter"
      :headers="headers"
      :hide-default-footer="orderedMeetingGroups.length <= ITEMS_PER_PAGE"
      :items="orderedMeetingGroups"
      :sort-by="[{ key: 'title' }]"
      :items-per-page="ITEMS_PER_PAGE"
      :items-per-page-text="$t('content.itemsPerPageText')"
      item-value="pk"
      :page-text="$t('content.pageText')"
      search=" "
      :row-props="
        ({ item }) => ({
          class: { 'bg-secondary-lighten-2': (item as any).isMember }
        })
      "
    >
      <template
        v-for="sw in groupSwitches"
        #[`header.${sw.prop}`]
        :key="sw.prop"
      >
        {{ sw.title }}
        <v-tooltip :text="sw.description" location="top">
          <template #activator="{ props }">
            <v-icon icon="mdi-help-circle" v-bind="props" class="ml-1 my-n2" />
          </template>
        </v-tooltip>
      </template>

      <template v-for="col in columns" #[`header.${col.name}`] :key="col.name">
        {{ col.title
        }}<span v-if="col.count !== undefined"> ({{ col.count }})</span>
        <v-tooltip
          v-if="col.description"
          :text="col.description"
          location="top"
        >
          <template #activator="{ props }">
            <v-icon icon="mdi-help-circle" v-bind="props" class="ml-1 my-n2" />
          </template>
        </v-tooltip>
      </template>

      <template #item.members="{ item }">
        {{ (item as any).members.length || '-' }}
        <DefaultDialog
          v-if="(item as any).members.length || canChangeMeeting"
          :title="$t('meeting.groups.membersIn', { ...(item as any) })"
        >
          <template #activator="{ props }">
            <v-btn
              color="secondary"
              class="ml-2"
              size="small"
              :text="canChangeMeeting ? $t('handle') : $t('show')"
              v-bind="props"
            />
          </template>
          <GroupMemberships :group="item as any" :editable="canChangeMeeting" />
        </DefaultDialog>
      </template>

      <template
        v-for="sw in groupSwitches"
        #[`item.${sw.prop}`]="{ item }"
        :key="sw.prop"
      >
        <v-switch
          color="primary"
          hide-details
          :model-value="(item as any)[sw.prop]"
          @click="toggleGroupProp(item as any, sw.prop)"
        />
      </template>

      <template
        v-for="col in columns"
        #[`item.${col.name}`]="{ item }"
        :key="col.name"
      >
        {{ col.getValue?.(item as any) }}
        <component
          v-if="col.component"
          :is="col.component"
          :group="item as any"
        />
      </template>

      <template v-if="allTags.size" #item.tags="{ item }">
        <Tag
          v-for="tag in (item as any).tags"
          :key="tag"
          :name="tag"
          class="mr-1"
        />
      </template>

      <template v-if="canChangeMeeting" #item.actions="{ item }">
        <div class="text-right">
          <DefaultDialog :title="$t('meeting.groups.edit')">
            <template #activator="{ props }">
              <ButtonWithDropdown
                color="primary"
                size="small"
                :text="$t('edit')"
                v-bind="props"
              >
                <v-list density="compact">
                  <QueryDialog
                    :text="
                      $t('meeting.groups.deleteConfirm', { ...(item as any) })
                    "
                    color="warning"
                    @confirmed="deleteGroup(item as any)"
                  >
                    <template #activator="{ props }">
                      <v-list-item
                        base-color="warning"
                        v-bind="props"
                        :title="$t('content.delete')"
                      />
                    </template>
                  </QueryDialog>
                </v-list>
              </ButtonWithDropdown>
            </template>
            <template #default="{ close }">
              <DefaultForm
                :handler="changeGroup((item as any).pk)"
                :modelValue="{ ...(item as any) }"
                @done="close"
                v-slot="{ errors, formData }"
              >
                <v-text-field
                  :error-messages="errors.title"
                  :label="$t('name')"
                  :rules="[rules.maxLength(100), rules.required]"
                  v-model="formData.title!"
                />
                <v-textarea
                  :error-messages="errors.body"
                  :label="$t('textBody')"
                  v-model="formData.body!"
                />
                <TagEdit :label="$t('tags')" v-model="formData.tags" />
                <v-text-field
                  v-if="meeting?.group_votes_active"
                  :error-messages="errors.votes"
                  :label="$t('meeting.groups.votes')"
                  min="0"
                  :rules="[rules.min(0)]"
                  type="number"
                  v-model="formData.votes"
                />
              </DefaultForm>
            </template>
          </DefaultDialog>
        </div>
      </template>
    </v-data-table>
  </div>
</template>
