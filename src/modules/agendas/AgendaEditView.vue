<script lang="ts" setup>
import Axios from 'axios'
import { difference } from 'lodash'
import { computed, ref, shallowReactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery, tagify } from '@/utils'
import { openAlertEvent } from '@/utils/events'
import { ThemeColor } from '@/utils/types'
import DefaultDialog from '@/components/DefaultDialog.vue'
import Headline from '@/components/Headline.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import { AlertLevel } from '@/composables/types'
import useErrorHandler from '@/composables/useErrorHandler'
import usePermission from '@/composables/usePermission'

import MeetingToolbar from '../meetings/MeetingToolbar.vue'
import useMeeting from '../meetings/useMeeting'
import useMeetingTitle from '../meetings/useMeetingTitle'
import { MeetingState } from '../meetings/types'

import useAgenda from './useAgenda'
import useAgendaStore from './useAgendaStore'
import useAgendaTags from './useAgendaTags'
import { AgendaItem, AgendaState } from './types'
import { canDeleteAgendaItem } from './rules'
import { agendaItemType } from './contentTypes'
import AgendaOrdering from './AgendaOrdering.vue'

const { t } = useI18n()
const agendaTag = ref<string | undefined>(undefined)
const { isModerator, meeting, meetingId, getMeetingRoute } = useMeeting()
const { createAgendaItem } = useAgendaStore()
const { agenda, filteredAgenda } = useAgenda(meetingId, agendaTag)
const { getState } = agendaItemType.useWorkflows()
const agendaApi = agendaItemType.getContentApi({ alertOnError: false })
const { handleSocketError } = useErrorHandler({ target: 'dialog' })

usePermission(isModerator, { to: computed(() => getMeetingRoute('meeting')) })
useMeetingTitle(t('agenda.agenda'))

const pages = shallowReactive({
  current: 1,
  itemsPerPage: 25
})
/**
 * Go to a specifik agenda item by setting page on the data-table.
 */
function goToAgendaItem(ai: number) {
  const index = agenda.value.findIndex(({ pk }) => pk === ai)
  pages.current = Math.floor(index / pages.itemsPerPage) + 1
}

const adding = shallowReactive({
  title: '',
  submitting: false
})
async function addAgendaItem() {
  adding.submitting = true
  try {
    const { pk } = await createAgendaItem(meetingId.value, adding.title)
    goToAgendaItem(pk)
    adding.title = ''
  } catch {
    alert("Couldn't create agenda item")
  }
  adding.submitting = false
}

const editSelected = ref<number[]>([])
/**
 * Keep track of available items and clear non-existing from selected
 */
watch(filteredAgenda, (items) => {
  const existingIds = new Set(items.map((ai) => ai.pk))
  editSelected.value = editSelected.value.filter((id) => existingIds.has(id))
})

const selectedAgendaItems = computed(() =>
  filteredAgenda.value.filter((ai) => editSelected.value.includes(ai.pk))
)
const editManyWorking = ref(false)

function isRejected(
  settled: PromiseSettledResult<unknown>
): settled is PromiseRejectedResult {
  return settled.status === 'rejected'
}

function getRejectedDescriptions(settled: PromiseSettledResult<unknown>[]) {
  const rejectedDescriptions = settled.filter(isRejected).map(({ reason }) => {
    if (Axios.isAxiosError(reason))
      return Object.values(reason.response?.data ?? {})[0]
    return t('error.unknown')
  })
  return [...new Set(rejectedDescriptions)]
}

async function actionOnSelected(
  fn: (ai: AgendaItem) => Promise<any>,
  confirm?: string
) {
  if (editManyWorking.value) return
  editManyWorking.value = true
  if (
    confirm &&
    !(await dialogQuery({
      title: confirm,
      theme: ThemeColor.Warning
    }))
  ) {
    editManyWorking.value = false
    return
  }
  const settled = await Promise.allSettled(selectedAgendaItems.value.map(fn))
  const rejectedDescriptions = getRejectedDescriptions(settled)
  if (rejectedDescriptions.length) {
    openAlertEvent.emit({
      title: t('error.error'),
      level: AlertLevel.Error,
      sticky: true,
      text: t(
        'agenda.changeManyFailed',
        {
          reason: rejectedDescriptions.join(', ')
        },
        rejectedDescriptions.length
      )
    })
  }
  editManyWorking.value = false
}

async function deleteSelected() {
  bulkChanging.value = true
  try {
    await agendaItemType.methodCall('bulk_delete', {
      meeting: meetingId.value,
      agenda_items: editSelected.value
    })
  } catch (e) {
    handleSocketError(e, '__root__')
  }
  bulkChanging.value = false
}

function patchAgendaItem(ai: AgendaItem, data: Partial<AgendaItem>) {
  agendaApi.patch(ai.pk, data)
}

const bulkChanging = ref(false)
async function patchSelected(data: Partial<AgendaItem>) {
  bulkChanging.value = true
  try {
    await agendaItemType.methodCall('bulk_update', {
      meeting: meetingId.value,
      agenda_items: editSelected.value,
      ...data
    })
  } catch (e) {
    handleSocketError(e, '__root__')
  }
  bulkChanging.value = false
}

/* TAGS */
const { agendaTags } = useAgendaTags(agenda)
const allSelectedTags = useAgendaTags(selectedAgendaItems).agendaTags
// const bulkTags = ref(allSelectedTags.value)
const bulkTags = computed({
  get() {
    return allSelectedTags.value
  },
  set(tags) {
    // Make sure to remove filter if filtered tag is removed
    if (agendaTag.value && !tags.includes(agendaTag.value))
      agendaTag.value = undefined
    // Compare to all selected tags to find what's changed
    difference(allSelectedTags.value, tags).map(tagBulkRemove)
    difference(tags, allSelectedTags.value).map(tagBulkAdd)
  }
})

function isBulkAllSelected(tag: string) {
  return selectedAgendaItems.value.every((ai) => ai.tags.includes(tag))
}
function tagBulkRemove(tag: string) {
  actionOnSelected(async ({ tags, pk }) => {
    if (!tags.includes(tag)) return
    await agendaItemType.api.patch(pk, { tags: tags.filter((t) => t !== tag) })
  })
}
function tagBulkAdd(tag: string) {
  console.log(tag)
  tag = tagify(tag)
  actionOnSelected(async ({ tags, pk }) => {
    if (tags.includes(tag)) return
    await agendaItemType.api.patch(pk, { tags: [...tags, tag] })
  })
}
/* END TAGS */

async function setTitle({ pk }: AgendaItem, title: string) {
  agendaItemType.api.patch(pk, { title })
}

/**
 * Used to disable state selection if all selected AI:s are already that state,
 * of if target is ongoing and meeting is not ongoing,
 */
function canSetState(target: AgendaState) {
  return (
    selectedAgendaItems.value.some((ai) => ai.state !== target) &&
    !(
      target === AgendaState.Ongoing &&
      meeting.value?.state !== MeetingState.Ongoing
    )
  )
}

function tagFilter(tags: string | string[], query: string) {
  if (!Array.isArray(tags)) tags = [tags]
  return tags.includes(query)
}
</script>

<template>
  <MeetingToolbar :title="$t('agenda.agenda')">
    <v-spacer />
    <DefaultDialog :title="$t('agenda.ordering')">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          color="primary"
          prepend-icon="mdi-reorder-horizontal"
          :text="$t('agenda.ordering')"
          variant="elevated"
        />
      </template>
      <template #default="{ close }">
        <AgendaOrdering @saved="close" />
      </template>
    </DefaultDialog>
  </MeetingToolbar>
  <div class="d-flex align-center" v-if="agendaTags.length < 5">
    <v-chip-group v-model="agendaTag">
      <v-chip
        v-for="tag in agendaTags"
        :key="tag"
        :value="tag"
        size="small"
        color="primary"
      >
        {{ tag }}
      </v-chip>
    </v-chip-group>
    <v-chip
      v-if="agendaTag"
      size="small"
      @click="agendaTag = undefined"
      prepend-icon="mdi-close"
      color="warning"
    >
      {{ $t('clear') }}
    </v-chip>
  </div>
  <v-select
    v-else
    v-model="agendaTag"
    :label="$t('agenda.filterOnTag')"
    :items="agendaTags"
    hide-details
    clearable
    density="compact"
    class="mb-1"
    style="max-width: 280px"
    variant="outlined"
  />
  <v-data-table
    :headers="[
      { title: $t('state'), key: 'state' },
      { title: $t('title'), key: 'title' },
      {
        title: $t('tags'),
        key: 'tags',
        sortable: false
      },
      { title: $t('proposal.proposals'), key: 'block_proposals' },
      { title: $t('discussion.discussions'), key: 'block_discussion' },
      { title: '', key: 'pk', sortable: false, align: 'end' }
    ]"
    show-select
    v-model="editSelected"
    v-model:items-per-page="pages.itemsPerPage"
    v-model:page="pages.current"
    item-value="pk"
    :custom-filter="tagFilter"
    :search="agendaTag"
    :filter-keys="['tags']"
    :items="agenda"
    :page-text="$t('content.pageText')"
    :items-per-page-text="$t('content.itemsPerPageText')"
    class="mb-2"
  >
    <template #no-data>
      <em class="text-secondary">
        {{ $t('agenda.editNoItems') }}
      </em>
    </template>
    <template #item.state="{ value }">
      <v-icon size="small" :icon="getState(value)?.icon" />
    </template>
    <template #item.title="{ item, value }">
      <Headline
        :modelValue="value"
        tag="h4"
        :maxlength="100"
        clickToEdit
        @update:modelValue="setTitle(item, $event)"
      />
    </template>
    <template #header.tags>
      <v-tooltip :text="$t('agenda.helpEditTags')" location="top">
        <template #activator="{ props }">
          <span v-bind="props" class="text-no-wrap">
            {{ $t('tags') }} <v-icon icon="mdi-help-circle" />
          </span>
        </template>
      </v-tooltip>
    </template>
    <template #item.tags="{ value }">
      <v-chip-group v-model="agendaTag">
        <v-chip
          v-for="tag in value"
          :key="tag"
          :value="tag"
          size="small"
          color="primary"
        >
          {{ tag }}
        </v-chip>
      </v-chip-group>
    </template>
    <template #item.block_proposals="{ item, value }">
      <v-switch
        :modelValue="!value"
        hide-details
        color="primary"
        @update:modelValue="patchAgendaItem(item, { block_proposals: !$event })"
      />
    </template>
    <template #item.block_discussion="{ item, value }">
      <v-switch
        :modelValue="!value"
        hide-details
        color="primary"
        @update:modelValue="
          patchAgendaItem(item, { block_discussion: !$event })
        "
      />
    </template>
    <template #item.pk="{ item, value }">
      <QueryDialog
        v-if="canDeleteAgendaItem(item)"
        color="warning"
        :text="$t('agenda.deleteItemConfirm')"
        @confirmed="agendaApi.delete(value)"
      >
        <template #activator="{ props }">
          <v-btn
            color="warning"
            prepend-icon="mdi-delete"
            size="small"
            :text="$t('content.delete')"
            v-bind="props"
          />
        </template>
      </QueryDialog>
    </template>
  </v-data-table>
  <v-expand-transition>
    <v-sheet
      v-if="selectedAgendaItems.length"
      :border="true"
      class="pa-4 d-flex flex-column ga-2"
      rounded
    >
      <h2>
        {{ $t('agenda.changeMany', selectedAgendaItems.length) }}
      </h2>
      <div>
        <QueryDialog
          color="warning"
          :text="$t('agenda.deleteSelectedConfirm', editSelected.length)"
          @confirmed="deleteSelected"
        >
          <template #activator="{ props }">
            <v-btn
              color="warning"
              :disabled="bulkChanging"
              prepend-icon="mdi-delete"
              :text="$t('content.delete')"
              v-bind="props"
            />
          </template>
        </QueryDialog>
      </div>
      <div class="d-flex flex-wrap ga-1">
        <v-btn
          color="primary"
          :disabled="bulkChanging || !canSetState(state.state)"
          :key="state.state"
          :prepend-icon="state.icon"
          v-for="state in agendaItemType.transitions.states.filter(
            (s) => s.transition
          )"
          :text="`${$t('agenda.setTo')} ${state.getName($t, 2)}`"
          @click="patchSelected({ state: state.state })"
        />
      </div>
      <div class="d-flex flex-wrap ga-1">
        <v-btn
          color="success"
          :disabled="bulkChanging"
          prepend-icon="mdi-text-box-plus-outline"
          :text="$t('agenda.allowProposals')"
          @click="patchSelected({ block_proposals: false })"
        />
        <v-btn
          color="warning"
          :disabled="bulkChanging"
          prepend-icon="mdi-text-box-plus-outline"
          :text="$t('agenda.blockProposals')"
          @click="patchSelected({ block_proposals: true })"
        />
      </div>
      <div class="d-flex flex-wrap ga-1">
        <v-btn
          color="success"
          :disabled="bulkChanging"
          prepend-icon="mdi-comment-outline"
          :text="$t('agenda.allowDiscussion')"
          @click="patchSelected({ block_discussion: false })"
        />
        <v-btn
          color="warning"
          :disabled="bulkChanging"
          prepend-icon="mdi-comment-outline"
          :text="$t('agenda.blockDiscussion')"
          @click="patchSelected({ block_discussion: true })"
        />
      </div>
      <div class="mt-4">
        <v-combobox
          v-model="bulkTags"
          :items="agendaTags"
          hide-details
          :label="$t('tags')"
          multiple
          variant="outlined"
        >
          <template #chip="{ item, props }">
            <v-chip
              v-bind="props"
              :color="isBulkAllSelected(item.value) ? 'primary' : 'secondary'"
              @click.stop="tagBulkAdd(item.value)"
              closable
            />
          </template>
        </v-combobox>
      </div>
    </v-sheet>
  </v-expand-transition>
  <v-divider class="mt-6 mb-2" />
  <h2 class="mb-2">{{ $t('agenda.newItem') }}</h2>
  <form class="d-flex" id="agenda-add-form" @submit.prevent="addAgendaItem">
    <v-text-field
      class="flex-grow-1 hide-details rounded-0"
      hide-details
      :label="$t('title')"
      maxlength="100"
      variant="outlined"
      v-model="adding.title"
    />
    <v-btn
      class="rounded-s-0"
      color="primary"
      :disabled="!adding.title"
      :loading="adding.submitting"
      prepend-icon="mdi-plus"
      :text="$t('add')"
      type="submit"
    />
  </form>
</template>

<style lang="sass" scoped>
#agenda-add-form
  .v-btn
    height: auto

  :deep(.v-field)
    border-top-right-radius: 0
    border-bottom-right-radius: 0
</style>
