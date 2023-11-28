<script lang="ts" setup>
import Axios from 'axios'
import { difference, isEqual } from 'lodash'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Draggable from 'vuedraggable'

import { dialogQuery } from '@/utils'
import { openAlertEvent } from '@/utils/events'
import { ThemeColor } from '@/utils/types'
import Headline from '@/components/Headline.vue'
import { WorkflowState } from '@/contentTypes/types'
import { AlertLevel } from '@/composables/types'
import usePermission from '@/composables/usePermission'
import QueryDialog from '@/components/QueryDialog.vue'

import MeetingToolbar from '../meetings/MeetingToolbar.vue'
import useMeeting from '../meetings/useMeeting'
import { meetingType } from '../meetings/contentTypes'
import useMeetingTitle from '../meetings/useMeetingTitle'
import { MeetingState } from '../meetings/types'

import useAgenda from './useAgenda'
import useAgendaTags from './useAgendaTags'
import { AgendaItem, AgendaState, AgendaTransition } from './types'
import { canDeleteAgendaItem } from './rules'
import { agendaItemType } from './contentTypes'

const { t } = useI18n()
const agendaTag = ref<string | undefined>(undefined)
const { isModerator, meeting, meetingId, getMeetingRoute } = useMeeting()
const { agenda, filteredAgenda, getAgendaItem } = useAgenda(
  meetingId,
  agendaTag
)
const { getState } = agendaItemType.useWorkflows()
const agendaApi = agendaItemType.getContentApi({ alertOnError: false })

usePermission(isModerator, { to: computed(() => getMeetingRoute('meeting')) })
useMeetingTitle(t('agenda.agenda'))

/*
/* START agenda ordering
 */
function isAI(ai?: AgendaItem): ai is AgendaItem {
  return !!ai
}
const actualAgendaOrder = computed(() => agenda.value.map((ai) => ai.pk))
const agendaItemOrder = ref(actualAgendaOrder.value)
const agendaOrderChanged = computed(
  () => !isEqual(agendaItemOrder.value, actualAgendaOrder.value)
)
const agendaItems = computed({
  get: () => agendaItemOrder.value.map(getAgendaItem).filter(isAI),
  set: (agendaItems: AgendaItem[]) => {
    agendaItemOrder.value = agendaItems.map((ai) => ai.pk)
  }
})
const orderSaving = ref(false)
async function saveAgendaOrder() {
  orderSaving.value = true
  try {
    await meetingType.api.action(meetingId.value, 'set_agenda_order', {
      order: agendaItemOrder.value
    })
  } catch {
    alert("^Couldn't save agenda order")
  }
  orderSaving.value = false
}
watch(agenda, (agendaItems) => {
  for (const ai of agendaItems) {
    if (!agendaItemOrder.value.includes(ai.pk))
      agendaItemOrder.value = [...agendaItemOrder.value, ai.pk]
  }
})
/*
/* END agenda ordering
 */

const editModes = computed(() => [
  {
    value: 'default',
    text: t('edit'),
    prependIcon: 'mdi-pencil'
  },
  {
    value: 'order',
    text: t('sort'),
    prependIcon: 'mdi-reorder-horizontal'
  }
])
const editMode = ref('default')

const newAgendaTitle = ref('')
async function addAgendaItem() {
  await agendaApi.add({
    meeting: meetingId.value,
    title: newAgendaTitle.value
  })
  newAgendaTitle.value = ''
}

const editSelected = ref<number[]>([])
const selectedAgendaItems = computed(() =>
  filteredAgenda.value.filter((ai) => editSelected.value.includes(ai.pk))
)
const editManyWorking = ref(false)

// eslint-disable-next-line no-undef
function isRejected(
  settled: PromiseSettledResult<unknown>
): settled is PromiseRejectedResult {
  return settled.status === 'rejected'
}

// eslint-disable-next-line no-undef
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

function deleteSelected() {
  actionOnSelected((ai) => agendaApi.delete(ai.pk))
}

function setStateSelected(state: WorkflowState<AgendaState, AgendaTransition>) {
  actionOnSelected((ai) => {
    if (ai.state === state.state) return Promise.resolve()
    if (!state.transition) return Promise.reject(new Error('No transition'))
    return agendaItemType.transitions.make(ai, state.transition, t)
  })
}

function patchAgendaItem(ai: AgendaItem, data: Partial<AgendaItem>) {
  agendaApi.patch(ai.pk, data)
}

function patchSelected(data: Partial<AgendaItem>) {
  actionOnSelected((ai) => agendaApi.patch(ai.pk, data))
}

/* TAGS */
const { agendaTags } = useAgendaTags(agendaItems)
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
  actionOnSelected(({ tags, pk }) => {
    if (!tags.includes(tag)) return Promise.resolve()
    return agendaItemType.api.patch(pk, { tags: tags.filter((t) => t !== tag) })
  })
}
function tagBulkAdd(tag: string) {
  actionOnSelected(({ tags, pk }) => {
    if (tags.includes(tag)) return Promise.resolve()
    return agendaItemType.api.patch(pk, { tags: [...tags, tag] })
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
</script>

<template>
  <MeetingToolbar :title="t('agenda.agenda')">
    <v-spacer />
    <v-tabs :items="editModes" v-model="editMode" />
  </MeetingToolbar>
  <v-window v-model="editMode">
    <v-window-item value="default">
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
          {{ t('clear') }}
        </v-chip>
      </div>
      <v-select
        v-else
        v-model="agendaTag"
        :label="t('agenda.filterOnTag')"
        :items="agendaTags"
        hide-details
        clearable
        density="compact"
        class="mb-1"
        style="max-width: 280px"
      />
      <v-data-table
        :headers="[
          { title: t('state'), key: 'state' },
          { title: t('title'), key: 'title' },
          {
            title: t('tags'),
            key: 'tags',
            sortable: false
          },
          { title: t('proposal.proposals'), key: 'block_proposals' },
          { title: t('discussion.discussions'), key: 'block_discussion' },
          { title: '', key: 'pk', sortable: false, align: 'end' }
        ]"
        show-select
        v-model="editSelected"
        item-value="pk"
        :custom-filter="(tags, query) => tags.includes(query)"
        :search="agendaTag"
        :filter-keys="['tags']"
        :items="agendaItems"
        :items-per-page="25"
        :page-text="t('content.pageText')"
        :items-per-page-text="t('content.itemsPerPageText')"
        class="mb-2"
      >
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
          <v-tooltip :text="t('agenda.helpEditTags')" location="top">
            <template #activator="{ props }">
              <span v-bind="props" class="text-no-wrap">
                {{ t('tags') }} <v-icon icon="mdi-help-circle" />
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
            @update:modelValue="
              patchAgendaItem(item, { block_proposals: !$event })
            "
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
            :text="t('agenda.deleteItemConfirm')"
            @confirmed="agendaApi.delete(value)"
          >
            <template #activator="{ props }">
              <v-btn
                color="warning"
                prepend-icon="mdi-delete"
                size="small"
                v-bind="props"
              >
                {{ t('content.delete') }}
              </v-btn>
            </template>
          </QueryDialog>
        </template>
      </v-data-table>
      <v-expand-transition>
        <v-sheet
          :border="true"
          rounded
          v-if="selectedAgendaItems.length"
          class="pa-2"
        >
          <h2 class="my-2">
            {{ t('agenda.changeMany', selectedAgendaItems.length) }}
          </h2>
          <QueryDialog
            :text="t('agenda.deleteSelectedConfirm', editSelected.length)"
            color="warning"
            @confirmed="deleteSelected"
          >
            <template #activator="{ props }">
              <v-btn color="warning" prepend-icon="mdi-delete" v-bind="props">
                {{ t('content.delete') }}
              </v-btn>
            </template>
          </QueryDialog>
          <div class="my-2">
            <v-btn
              color="primary"
              class="mt-1 mr-1"
              :prepend-icon="state.icon"
              v-for="state in agendaItemType.transitions.states.filter(
                (s) => s.transition
              )"
              :key="state.state"
              :disabled="!canSetState(state.state)"
              @click="setStateSelected(state)"
              >{{ t('agenda.setTo') }} {{ state.getName(t, 2) }}</v-btn
            >
          </div>
          <div class="my-2">
            <v-btn
              color="success"
              class="mr-1"
              prepend-icon="mdi-text-box-plus-outline"
              @click="patchSelected({ block_proposals: false })"
              >{{ t('agenda.allowProposals') }}</v-btn
            >
            <v-btn
              color="warning"
              prepend-icon="mdi-text-box-plus-outline"
              @click="patchSelected({ block_proposals: true })"
              >{{ t('agenda.blockProposals') }}</v-btn
            >
          </div>
          <div class="my-2">
            <v-btn
              color="success"
              class="mr-1"
              prepend-icon="mdi-comment-outline"
              @click="patchSelected({ block_discussion: false })"
              >{{ t('agenda.allowDiscussion') }}</v-btn
            >
            <v-btn
              color="warning"
              prepend-icon="mdi-comment-outline"
              @click="patchSelected({ block_discussion: true })"
              >{{ t('agenda.blockDiscussion') }}</v-btn
            >
          </div>
          <div class="my-2">
            <v-combobox
              v-model="bulkTags"
              :items="agendaTags"
              hide-details
              multiple
              :label="t('tags')"
            >
              <template #chip="{ item, props }">
                <v-chip
                  v-bind="props"
                  :color="
                    isBulkAllSelected(item.value) ? 'primary' : 'secondary'
                  "
                  @click.self.stop="tagBulkAdd(item.value)"
                  closable
                />
              </template>
            </v-combobox>
          </div>
        </v-sheet>
      </v-expand-transition>
      <v-divider class="mt-6 mb-2" />
      <h2>{{ t('agenda.newItem') }}</h2>
      <form
        @submit.prevent="addAgendaItem()"
        id="agenda-add-form"
        class="d-flex mb-2"
      >
        <v-text-field
          :label="t('title')"
          required
          maxlength="100"
          v-model="newAgendaTitle"
          hide-details
          class="flex-grow-1 hide-details"
        />
        <v-btn
          prepend-icon="mdi-plus"
          type="submit"
          :disabled="!newAgendaTitle"
          color="primary"
          >{{ t('add') }}</v-btn
        >
      </form>
    </v-window-item>
    <v-window-item value="order">
      <Draggable v-model="agendaItems" item-key="pk">
        <template #item="{ element }">
          <div>
            <v-icon size="small" :icon="getState(element.state)?.icon" />
            <span>{{ element.title }}</span>
            <v-icon size="small" icon="mdi-drag-horizontal" />
          </div>
        </template>
      </Draggable>
      <div class="text-right">
        <v-btn
          class="my-1"
          color="primary"
          :disabled="!agendaOrderChanged"
          :loading="orderSaving"
          @click="saveAgendaOrder"
        >
          {{ t('save') }}
        </v-btn>
      </div>
    </v-window-item>
  </v-window>
</template>

<style lang="sass" scoped>
[data-draggable]
  padding: .5em
  margin-bottom: .3em
  border: 1px solid #ddd
  border-radius: 3px
  display: flex
  cursor: grab
  span
    flex-grow: 1
    padding: 0 .8em
  .material-icons
    color: #999

.sortable-chosen
  background-color: #eee

.sortable-ghost
  opacity: .5

#agenda-add-form
  .v-btn
    border-top-left-radius: 0
    border-bottom-left-radius: 0
    height: auto
</style>
