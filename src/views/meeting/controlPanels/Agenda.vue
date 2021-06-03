<template>
  <h2>{{ t('agenda.newItem') }}</h2>
  <form @submit.prevent="addAgendaItem" class="agenda-add-form mb-2">
    <input ref="inputEl" type="text" :placeholder="t('title')" required v-model="newAgendaTitle" @keyup.ctrl.enter="addAgendaItem" />
    <v-btn :disabled="!newAgendaTitle" color="primary" @click="addAgendaItem">{{ t('add') }}</v-btn>
  </form>
  <div class="btn-controls">
    <v-btn v-for="tab in editModes" :key="tab.name" color="primary" :plain="editMode.name !== tab.name" :outlined="editMode.name !== tab.name" @click="editMode = tab">{{ tab.title }}</v-btn>
  </div>
  <h2>{{ editMode.title }}</h2>
  <ul v-if="editMode.name === 'default'" class="agenda-edit">
    <li v-for="ai in agendaItems" :key="ai.pk">
      <v-icon size="small" :icon="getState(ai.state).icon" />
      <span>{{ ai.title }}</span>
      <v-btn v-if="canDelete(ai)" color="warning" prepend-icon="mdi-delete" size="small" @click="deleteItem(ai)">{{ t('delete') }}</v-btn>
    </li>
  </ul>
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

import useAgenda from '@/composables/meeting/useAgenda'
import useMeeting from '@/composables/meeting/useMeeting'

import meetingType from '@/contentTypes/meeting'
import agendaItemType from '@/contentTypes/agendaItem'
import { AgendaItem } from '@/contentTypes/types'
import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'
import { ControlPanelComponent } from './types'

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
    const agendaApi = agendaItemType.getContentApi()

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

    return {
      t,
      title: computed(() => t('agenda')),
      deleteItem,
      editMode,
      editModes,
      agendaItems,
      getState,
      addAgendaItem,
      newAgendaTitle,
      ...agendaItemType.rules
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

.agenda-edit
  list-style: none
  li
    display: flex
    padding: .4em
    align-items: center
    &:nth-child(odd)
      background-color: rgb(var(--v-theme-surface))
    > span
      flex: 1 1 auto
      padding: 0 1em
</style>
