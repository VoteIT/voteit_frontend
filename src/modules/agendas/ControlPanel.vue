<template>
  <v-tabs :items="editModes" v-model="editMode" right class="mb-4" />
  <v-window v-model="editMode">
    <v-window-item value="default">
      <v-chip-group v-model="agendaTag">
        <v-chip v-for="tag in agendaTags" :key="tag" :value="tag" size="small">
          {{ tag }}
        </v-chip>
      </v-chip-group>
      <v-table id="agenda-edit">
        <thead>
          <tr>
            <th>
              <input type="checkbox" v-model="editIsAllSelected">
            </th>
            <th>{{ t('state') }}</th>
            <th width="100%">{{ t('title') }}</th>
            <th>{{ t('tags') }}</th>
            <th>{{ t('proposal.proposals') }}</th>
            <th>{{ t('discussion.discussions') }}</th>
            <th/>
          </tr>
        </thead>
        <v-item-group tag="tbody" multiple v-model="editSelected">
          <v-item v-for="ai in filteredAgenda" :key="ai.pk" v-slot="{ toggle, isSelected }" :value="ai.pk">
            <tr>
              <td>
                <input type="checkbox" :checked="isSelected" @change.prevent="toggle()" class="mr-2">
              </td>
              <td class="state">
                <v-icon size="small" :icon="getState(ai.state).icon" />
              </td>
              <td>{{ ai.title }}</td>
              <td>
                <v-chip-group disabled>
                  <v-chip v-for="tag in ai.tags" :key="tag" size="small">
                    {{ tag }}
                  </v-chip>
                </v-chip-group>
              </td>
              <td class="state">
                <v-switch :modelValue="!ai.block_proposals" hide-details color="primary" @update:modelValue="patchAgendaItem(ai, { block_proposals: !$event })" />
              </td>
              <td class="state">
                <v-switch :modelValue="!ai.block_discussion" hide-details color="primary" @update:modelValue="patchAgendaItem(ai, { block_discussion: !$event })" />
              </td>
              <td>
                <v-btn v-if="canDeleteAgendaItem(ai)" color="warning" prepend-icon="mdi-delete" size="small" @click="deleteItem(ai)">{{ t('delete') }}</v-btn>
              </td>
            </tr>
          </v-item>
        </v-item-group>
      </v-table>
      <v-expand-transition>
        <v-sheet border rounded v-if="selectedAgendaItems.length" class="pa-2">
          <h2 class="my-2">
            {{ t('agenda.changeMany', selectedAgendaItems.length) }}
          </h2>
          <v-btn color="warning" prepend-icon="mdi-delete" @click="deleteSelected()">
            {{ t('delete') }}
          </v-btn>
          <div class="my-2">
            <v-btn color="primary" class="mt-1 mr-1" :prepend-icon="state.icon" v-for="state in agendaStates.filter(s => s.transition)" :key="state.name" :disabled="state.state === selectedSingularState" @click="setStateSelected(state)">{{ t('agenda.setTo') }} {{ t(`workflowState.${state.state}`) }}</v-btn>
          </div>
          <div class="my-2">
            <v-btn color="success-darken-2" class="mr-1" prepend-icon="mdi-text-box-plus-outline" @click="patchSelected({ block_proposals: false })">{{ t('agenda.allowProposals') }}</v-btn>
            <v-btn color="warning" prepend-icon="mdi-text-box-plus-outline" @click="patchSelected({ block_proposals: true })">{{ t('agenda.blockProposals') }}</v-btn>
          </div>
          <div class="my-2">
            <v-btn color="success-darken-2" class="mr-1" prepend-icon="mdi-comment-outline" @click="patchSelected({ block_discussion: false })">{{ t('agenda.allowDiscussion') }}</v-btn>
            <v-btn color="warning" prepend-icon="mdi-comment-outline" @click="patchSelected({ block_discussion: true })">{{ t('agenda.blockDiscussion') }}</v-btn>
          </div>
          <div class="my-2">
            <v-combobox v-model="bulkTags" :items="agendaTags" hide-details multiple :label="t('tags')">
              <template #chip="{ props, selection }">
                <v-chip v-bind="props" :color="isBulkAllSelected(selection.value) ? 'primary' : 'secondary'" @click.self.stop="tagBulkAdd(selection.value)" closable @click:close.prevent="tagBulkRemove(selection.value)">
                  {{ selection.value }}
                </v-chip>
              </template>
            </v-combobox>
          </div>
        </v-sheet>
      </v-expand-transition>
      <v-divider class="mt-6 mb-2" />
      <h2>{{ t('agenda.newItem') }}</h2>
      <form @submit.prevent="addAgendaItem()" id="agenda-add-form" class="d-flex mb-2">
        <v-text-field :label="t('title')" required v-model="newAgendaTitle" hide-details class="flex-grow-1 hide-details" />
        <v-btn prepend-icon="mdi-plus" type="submit" :disabled="!newAgendaTitle" color="primary">{{ t('add') }}</v-btn>
      </form>
    </v-window-item>
    <v-window-item value="order">
      <Draggable v-model="agendaItems" item-key="pk" >
        <template #item="{ element }">
          <div>
            <v-icon size="small" :icon="getState(element.state).icon" />
            <span>{{ element.title }}</span>
            <v-icon size="small" icon="mdi-drag-horizontal"/>
          </div>
        </template>
      </Draggable>
    </v-window-item>
  </v-window>
</template>

<script lang="ts">
import Axios from 'axios'
import { isEqual } from 'lodash'
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Draggable from 'vuedraggable'

import { dialogQuery } from '@/utils'
import { openAlertEvent } from '@/utils/events'
import { ThemeColor } from '@/utils/types'
import { WorkflowState } from '@/contentTypes/types'
import { AlertLevel } from '@/composables/types'

import useMeeting from '../meetings/useMeeting'
import { meetingType } from '../meetings/contentTypes'

import useAgenda from './useAgenda'
import useAgendaTags from './useAgendaTags'
import { AgendaItem } from './types'
import { canDeleteAgendaItem } from './rules'
import { agendaItemType } from './contentTypes'

export default defineComponent({
  translationKey: 'agenda.agenda',
  path: 'agenda',
  icon: 'mdi-clipboard-list',
  components: {
    Draggable
  },
  setup () {
    const { t } = useI18n()
    const agendaTag = ref<string | undefined>(undefined)
    const { meetingId } = useMeeting()
    const { agenda, filteredAgenda } = useAgenda(meetingId, agendaTag)
    const { getState } = agendaItemType.useWorkflows()
    const agendaApi = agendaItemType.getContentApi({ alertOnError: false })

    const agendaItems = computed({
      get: () => agenda.value,
      set: (agendaItems: AgendaItem[]) => {
        meetingType.api.action(meetingId.value, 'set_agenda_order', { order: agendaItems.map(ai => ai.pk) })
      }
    })

    const editModes = computed(() => {
      return [{
        value: 'default',
        title: t('agenda.edit')
      },
      {
        value: 'order',
        title: t('agenda.order')
      }]
    })
    const editMode = ref('default')

    const newAgendaTitle = ref('')
    async function addAgendaItem () {
      await agendaApi.add({
        meeting: meetingId.value,
        title: newAgendaTitle.value
      })
      newAgendaTitle.value = ''
    }

    async function deleteItem (ai: AgendaItem) {
      if (await dialogQuery({
        title: t('agenda.deleteItemConfirm'),
        theme: ThemeColor.Warning
      })) agendaApi.delete(ai.pk)
    }

    const editSelected = ref<number[]>([])
    const selectedAgendaItems = computed(() => filteredAgenda.value.filter(ai => editSelected.value.includes(ai.pk)))
    const selectedSingularState = computed(() => {
      const states = new Set(selectedAgendaItems.value.map(ai => ai?.state))
      if (states.size !== 1) return
      return states.values().next().value
    })
    const editManyWorking = ref(false)
    const editIsAllSelected = computed({
      get: () => selectedAgendaItems.value.length === filteredAgenda.value.length,
      set: (value: boolean) => {
        if (value) {
          editSelected.value = filteredAgenda.value.map(ai => ai.pk)
        } else {
          editSelected.value = []
        }
      }
    })

    function isRejected (settled: PromiseSettledResult<any>): settled is PromiseRejectedResult {
      return settled.status === 'rejected'
    }

    function getRejectedDescriptions (settled: PromiseSettledResult<any>[]) {
      const rejectedDescriptions = settled
        .filter(isRejected)
        .map(({ reason }) => {
          if (Axios.isAxiosError(reason)) return Object.values(reason.response?.data ?? {})[0]
          return t('error.unknown')
        })
      return [...new Set(rejectedDescriptions)]
    }

    async function actionOnSelected (fn: (ai: AgendaItem) => Promise<any>, confirm?: string) {
      if (editManyWorking.value) return
      editManyWorking.value = true
      if (confirm && !await dialogQuery({
        title: confirm,
        theme: ThemeColor.Warning
      })) {
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
          text: t('agenda.changeManyFailed', {
            reason: rejectedDescriptions.join(', ')
          }, rejectedDescriptions.length)
        })
      }
      editManyWorking.value = false
    }

    function deleteSelected () {
      actionOnSelected(
        ai => agendaApi.delete(ai.pk),
        t('agenda.deleteSelectedConfirm', { count: editSelected.value.length }, editSelected.value.length)
      )
    }

    function setStateSelected (state: WorkflowState) {
      actionOnSelected(ai => {
        if (ai.state === state.state) return Promise.resolve()
        if (!state.transition) return Promise.reject(new Error('No transition'))
        return agendaApi.transition(ai.pk, state.transition)
      })
    }

    function patchAgendaItem (ai: AgendaItem, data: Partial<AgendaItem>) {
      agendaApi.patch(ai.pk, data)
    }

    function patchSelected (data: Partial<AgendaItem>) {
      actionOnSelected(ai => agendaApi.patch(ai.pk, data))
    }

    /* TAGS */
    const { agendaTags } = useAgendaTags(agendaItems)
    const allSelectedTags = useAgendaTags(selectedAgendaItems).agendaTags
    const bulkTags = ref(allSelectedTags.value)
    watch(allSelectedTags, tags => {
      // Avoid unnecessary modification
      if (isEqual(new Set(bulkTags.value), new Set(tags))) return
      bulkTags.value = tags
    })
    // Deep watch, because v-model won't trigger computed setter
    watch(bulkTags, (tags) => {
      // Compare to all selected tags to find what's changed
      // Can't use reactive allSelectedTags for some reason
      const allSelected = new Set(selectedAgendaItems.value.flatMap(ai => ai.tags))
      const added = tags.filter(tag => !allSelected.has(tag))
      const removed = [...allSelected].filter(tag => !tags.includes(tag))
      added.forEach(tagBulkAdd)
      removed.forEach(tagBulkRemove)
    }, { deep: true })

    function isBulkAllSelected (tag: string) {
      return selectedAgendaItems.value.every(ai => ai.tags.includes(tag))
    }
    function tagBulkRemove (tag: string) {
      for (const { tags, pk } of selectedAgendaItems.value) {
        if (!tags.includes(tag)) continue
        agendaItemType.api.patch(pk, { tags: tags.filter(t => t !== tag) })
      }
    }
    function tagBulkAdd (tag: string) {
      for (const { tags, pk } of selectedAgendaItems.value) {
        if (tags.includes(tag)) continue
        agendaItemType.api.patch(pk, { tags: [...tags, tag] })
      }
    }
    /* END TAGS */

    return {
      t,
      agendaTag,
      agendaTags,
      bulkTags,
      editManyWorking,
      editMode,
      editModes,
      filteredAgenda,
      agendaItems,
      newAgendaTitle,
      editIsAllSelected,
      editSelected,
      agendaStates: agendaItemType.workflowStates,
      selectedAgendaItems,
      selectedSingularState,
      addAgendaItem,
      canDeleteAgendaItem,
      deleteItem,
      deleteSelected,
      getState,
      patchAgendaItem,
      patchSelected,
      setStateSelected,
      isBulkAllSelected,
      tagBulkAdd,
      tagBulkRemove
    }
  }
})
</script>

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

// #agenda-edit
//   width: 100%
//   border-spacing: 0
//   td, th
//     padding: .4em
//   th
//     text-align: left
//   .title
//     width: 100%
//   td.state
//     text-align: center
//   tbody
//     tr:nth-child(odd)
//       background-color: rgb(var(--v-theme-surface))
</style>
