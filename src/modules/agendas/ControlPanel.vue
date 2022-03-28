<template>
  <Tabs :tabs="editModes">
    <template #default>
      <v-table id="agenda-edit">
        <thead>
          <tr>
            <th>
              <input type="checkbox" v-model="editIsAllSelected">
            </th>
            <th>{{ t('state') }}</th>
            <th width="100%">{{ t('title') }}</th>
            <th>{{ t('proposal.proposals') }}</th>
            <th>{{ t('discussion.discussions') }}</th>
            <th/>
          </tr>
        </thead>
        <v-item-group tag="tbody" multiple v-model="editSelected">
          <v-item v-for="ai in agendaItems" :key="ai.pk" v-slot="{ toggle, isSelected }" :value="ai.pk">
            <tr>
              <td>
                <input type="checkbox" :checked="isSelected" @change.prevent="toggle()" class="mr-2">
              </td>
              <td class="state">
                <v-icon size="small" :icon="getState(ai.state).icon" />
              </td>
              <td>{{ ai.title }}</td>
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
        <v-sheet border rounded v-show="editSelected.length" class="pa-2">
          <h2>
            {{ t('agenda.changeMany', { count: editSelected.length }, editSelected.length) }}
          </h2>
          <v-btn color="warning" prepend-icon="mdi-delete" @click="deleteSelected()">{{ t('delete') }}</v-btn>
          <div>
            <v-btn color="primary" class="mt-2 mr-1" :prepend-icon="state.icon" v-for="state in agendaStates.filter(s => s.transition)" :key="state.name" :disabled="state.state === selectedSingularState" @click="setStateSelected(state)">{{ t('agenda.setTo') }} {{ t(`workflowState.${state.state}`) }}</v-btn>
          </div>
          <div>
            <v-btn color="success-darken-2" class="mt-2 mr-1" prepend-icon="mdi-text-box-plus-outline" @click="patchSelected({ block_proposals: false })">{{ t('agenda.allowProposals') }}</v-btn>
            <v-btn color="warning" class="mt-2 mr-1" prepend-icon="mdi-text-box-plus-outline" @click="patchSelected({ block_proposals: true })">{{ t('agenda.blockProposals') }}</v-btn>
          </div>
          <div>
            <v-btn color="success-darken-2" class="mt-2 mr-1" prepend-icon="mdi-comment-outline" @click="patchSelected({ block_discussion: false })">{{ t('agenda.allowDiscussion') }}</v-btn>
            <v-btn color="warning" class="mt-2 mr-1" prepend-icon="mdi-comment-outline" @click="patchSelected({ block_discussion: true })">{{ t('agenda.blockDiscussion') }}</v-btn>
          </div>
        </v-sheet>
      </v-expand-transition>
      <v-divider class="mt-6 mb-2" />
      <h2>{{ t('agenda.newItem') }}</h2>
      <form @submit.prevent="addAgendaItem()" id="agenda-add-form" class="d-flex mb-2">
        <v-text-field :label="t('title')" required v-model="newAgendaTitle" hide-details class="flex-grow-1 hide-details" />
        <v-btn prepend-icon="mdi-plus" type="submit" :disabled="!newAgendaTitle" color="primary">{{ t('add') }}</v-btn>
      </form>
    </template>
    <template #order>
      <Draggable v-model="agendaItems" item-key="pk" >
        <template #item="{ element }">
          <div>
            <v-icon size="small" :icon="getState(element.state).icon" />
            <span>{{ element.title }}</span>
            <v-icon size="small" icon="mdi-drag-horizontal"/>
          </div>
        </template>
      </Draggable>
    </template>
  </Tabs>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Draggable from 'vuedraggable'
import Axios from 'axios'

import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'
import { Tab } from '@/components/types'
import { WorkflowState } from '@/contentTypes/types'
import { AlertLevel } from '@/composables/types'
import Tabs from '@/components/Tabs.vue'

import useAgenda from '../agendas/useAgenda'
import { AgendaItem } from '../agendas/types'
import useMeeting from '../meetings/useMeeting'
import { meetingType } from '../meetings/contentTypes'

import { canDeleteAgendaItem } from './rules'
import { agendaItemType } from './contentTypes'
import { openAlertEvent } from '@/utils/events'

export default defineComponent({
  translationKey: 'agenda.agenda',
  path: 'agenda',
  icon: 'mdi-clipboard-list',
  components: {
    Draggable,
    Tabs
  },
  setup () {
    const { t } = useI18n()
    const { getAgenda, getAgendaItem } = useAgenda()
    const { meetingId } = useMeeting()
    const { getState } = agendaItemType.useWorkflows()
    const agendaApi = agendaItemType.getContentApi({ alertOnError: false })

    const agendaItems = computed({
      get: () => getAgenda(meetingId.value),
      set: (agendaItems: AgendaItem[]) => {
        meetingType.api.action(meetingId.value, 'set_agenda_order', { order: agendaItems.map(ai => ai.pk) })
      }
    })

    const editModes = computed<Tab[]>(() => {
      return [{
        name: 'default',
        title: t('agenda.edit')
      },
      {
        name: 'order',
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
    const selectedAgendaItems = computed(() => editSelected.value.map(getAgendaItem) as AgendaItem[])
    const selectedSingularState = computed(() => {
      const states = new Set(selectedAgendaItems.value.map(ai => ai?.state))
      if (states.size !== 1) return
      return states.values().next().value
    })
    const editManyWorking = ref(false)
    const editIsAllSelected = computed({
      get: () => agendaItems.value.length === editSelected.value.length,
      set: (value: boolean) => {
        if (value) {
          editSelected.value = agendaItems.value.map(ai => ai.pk)
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

    return {
      t,
      editManyWorking,
      editMode,
      editModes,
      agendaItems,
      newAgendaTitle,
      editIsAllSelected,
      editSelected,
      agendaStates: agendaItemType.workflowStates,
      selectedSingularState,
      addAgendaItem,
      canDeleteAgendaItem,
      deleteItem,
      deleteSelected,
      getState,
      patchAgendaItem,
      patchSelected,
      setStateSelected
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
