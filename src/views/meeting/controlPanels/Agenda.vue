<template>
  <v-item-group class="btn-controls mb-4" v-model="editMode">
    <v-item v-for="tab in editModes" :key="tab.name" :value="tab" v-slot="{ isSelected, toggle }">
      <v-btn color="accent" :variant="isSelected ? 'contained' : 'outlined'" @click="toggle()">{{ tab.title }}</v-btn>
    </v-item>
  </v-item-group>
  <div v-if="editMode.name === 'default'">
    <v-item-group tag="table" id="agenda-edit" multiple v-model="editSelected">
      <thead>
        <tr>
          <th>
            <input type="checkbox" v-model="editIsAllSelected">
          </th>
          <th>{{ t('state') }}</th>
          <th class="title">{{ t('title') }}</th>
          <th>{{ t('proposal.proposals') }}</th>
          <th>{{ t('discussion.discussions') }}</th>
          <th/>
        </tr>
      </thead>
      <tbody>
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
              <v-btn :icon="ai.block_proposals ? 'mdi-cancel' : 'mdi-check'" :color="ai.block_proposals ? 'warning' : 'success-darken-2'" size="x-small" @click="patchAgendaItem(ai, { block_proposals: !ai.block_proposals })"/>
            </td>
            <td class="state">
              <v-btn :icon="ai.block_discussion ? 'mdi-cancel' : 'mdi-check'" :color="ai.block_discussion ? 'warning' : 'success-darken-2'" size="x-small" @click="patchAgendaItem(ai, { block_discussion: !ai.block_discussion })"/>
            </td>
            <td>
              <v-btn v-if="canDelete(ai)" color="warning" prepend-icon="mdi-delete" size="small" @click="deleteItem(ai)">{{ t('delete') }}</v-btn>
            </td>
          </tr>
        </v-item>
      </tbody>
    </v-item-group>
    <v-expand-transition>
      <v-sheet border rounded v-show="editSelected.length" class="pa-2">
        <h2>
          {{ t('agenda.changeMany', { count: editSelected.length }, editSelected.length) }}
        </h2>
        <v-btn color="warning" prepend-icon="mdi-delete" :disabled="editManyWorking" @click="deleteSelected()">{{ t('delete') }}</v-btn>
        <div>
          <v-btn color="primary" class="mt-2 mr-1" :prepend-icon="state.icon" v-for="state in agendaStates.filter(s => s.transition)" :key="state.name" :disabled="editManyWorking" @click="setStateSelected(state)">Set to {{ t(`workflowState.${state.state}`) }}</v-btn>
        </div>
        <div>
          <v-btn color="success-darken-2" class="mt-2 mr-1" prepend-icon="mdi-text-box-plus-outline" :disabled="editManyWorking" @click="patchSelected({ block_proposals: false })">{{ t('agenda.allowProposals') }}</v-btn>
          <v-btn color="warning" class="mt-2 mr-1" prepend-icon="mdi-text-box-plus-outline" :disabled="editManyWorking" @click="patchSelected({ block_proposals: true })">{{ t('agenda.blockProposals') }}</v-btn>
        </div>
        <div>
          <v-btn color="success-darken-2" class="mt-2 mr-1" prepend-icon="mdi-comment-outline" :disabled="editManyWorking" @click="patchSelected({ block_discussion: false })">{{ t('agenda.allowDiscussion') }}</v-btn>
          <v-btn color="warning" class="mt-2 mr-1" prepend-icon="mdi-comment-outline" :disabled="editManyWorking" @click="patchSelected({ block_discussion: true })">{{ t('agenda.blockDiscussion') }}</v-btn>
        </div>
      </v-sheet>
    </v-expand-transition>
    <v-divider class="mt-6 mb-2" />
    <h2>{{ t('agenda.newItem') }}</h2>
    <form @submit.prevent="addAgendaItem" class="agenda-add-form mb-2">
      <input ref="inputEl" type="text" :placeholder="t('title')" required v-model="newAgendaTitle" @keyup.ctrl.enter="addAgendaItem" />
      <v-btn :disabled="!newAgendaTitle" color="primary" @click="addAgendaItem">{{ t('add') }}</v-btn>
    </form>
  </div>
  <div v-if="editMode.name === 'order'">
    <Draggable v-model="agendaItems" item-key="pk" >
      <template #item="{ element }">
        <div>
          <v-icon size="small" :icon="getState(element.state).icon" />
          <span>{{ element.title }}</span>
          <v-icon size="small" icon="mdi-drag-horizontal"/>
        </div>
      </template>
    </Draggable>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Draggable from 'vuedraggable'

import useAgenda from '@/modules/agendas/useAgenda'
import useMeeting from '@/modules/meetings/useMeeting'

import meetingType from '@/contentTypes/meeting'
import agendaItemType from '@/contentTypes/agendaItem'
import { AgendaItem, WorkflowState } from '@/contentTypes/types'
import { dialogQuery, openAlertEvent } from '@/utils'
import { ThemeColor } from '@/utils/types'
import { ControlPanelComponent } from './types'
import { AxiosError, AxiosResponse } from 'axios'
import { AlertLevel } from '@/composables/types'

interface Tab {
  name: string
  title: string
}

export default defineComponent({
  name: 'Agenda',
  path: 'agenda',
  icon: 'mdi-clipboard-list',
  components: {
    Draggable
  },
  setup () {
    const { t } = useI18n()
    const { getAgenda } = useAgenda()
    const { meetingId } = useMeeting()
    const meetingAPI = meetingType.getContentApi()
    const { getState } = agendaItemType.useWorkflows()
    const agendaApi = agendaItemType.getContentApi({ alertOnError: false })

    const agendaItems = computed({
      get: () => getAgenda(meetingId.value),
      set: (agendaItems: AgendaItem[]) => {
        meetingAPI.action(meetingId.value, 'set_agenda_order', { order: agendaItems.map(ai => ai.pk) })
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
    const editMode = ref<Tab>(editModes.value[0])

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

    async function actionOnSelected (fn: (pk: number) => Promise<AxiosResponse>, confirm?: string) {
      editManyWorking.value = true
      if (confirm && !await dialogQuery({
        title: confirm,
        theme: ThemeColor.Warning
      })) {
        editManyWorking.value = false
        return
      }
      const settled = await Promise.allSettled(editSelected.value.map(fn))
      const rejected = settled.filter(r => r.status === 'rejected') as PromiseRejectedResult[]
      if (rejected.length) {
        openAlertEvent.emit({
          title: t('error.error'),
          level: AlertLevel.Error,
          sticky: true,
          text: t('agenda.changeManyFailed', {
            count: rejected.length,
            reason: (rejected[0].reason as AxiosError).response?.data.error ?? t('error.unknown')
          }, rejected.length)
        })
      }
      editManyWorking.value = false
    }

    function deleteSelected () {
      actionOnSelected(
        pk => agendaApi.delete(pk),
        t('agenda.deleteSelectedConfirm', { count: editSelected.value.length }, editSelected.value.length)
      )
    }

    function setStateSelected (state: WorkflowState) {
      actionOnSelected(pk => {
        if (!state.transition) return Promise.reject(new Error('No transition'))
        return agendaApi.transition(pk, state.transition)
      })
    }

    function patchAgendaItem (ai: AgendaItem, data: Partial<AgendaItem>) {
      agendaApi.patch(ai.pk, data)
    }

    function patchSelected (data: Partial<AgendaItem>) {
      actionOnSelected(pk => agendaApi.patch(pk, data))
    }

    return {
      t,
      title: computed(() => t('agenda')),
      deleteItem,
      deleteSelected,
      setStateSelected,
      patchAgendaItem,
      patchSelected,
      editManyWorking,
      editMode,
      editModes,
      agendaItems,
      getState,
      addAgendaItem,
      newAgendaTitle,
      editIsAllSelected,
      editSelected,
      ...agendaItemType.rules,
      agendaStates: agendaItemType.workflowStates
    }
  }
}) as ControlPanelComponent
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

.agenda-add-form
  display: flex
  input[type=text]
    flex: 1 1 auto
  .v-btn
    border-top-left-radius: 0
    border-bottom-left-radius: 0

#agenda-edit
  width: 100%
  border-spacing: 0
  td, th
    padding: .4em
  th
    text-align: left
  .title
    width: 100%
  td.state
    text-align: center
  tbody
    tr:nth-child(odd)
      background-color: rgb(var(--v-theme-surface))
</style>
