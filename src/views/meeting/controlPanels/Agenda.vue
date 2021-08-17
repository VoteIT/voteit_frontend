<template>
  <v-item-group class="btn-controls mb-4" v-model="editMode">
    <v-item v-for="tab in editModes" :key="tab.name" :value="tab" v-slot="{ isSelected, toggle }">
      <v-btn color="accent" :variant="isSelected ? 'contained' : 'outlined'" @click="toggle()">{{ tab.title }}</v-btn>
    </v-item>
  </v-item-group>
  <div v-if="editMode.name === 'default'">
    <v-item-group tag="ul" class="agenda-edit" multiple v-model="editSelected">
      <li class="d-none"><!-- TODO change many -->
        <input type="checkbox" v-model="editIsAllSelected">
      </li>
      <v-item v-for="ai in agendaItems" :key="ai.pk" v-slot="{ toggle, isSelected }" :value="ai.pk">
        <li>
          <input type="checkbox" :checked="isSelected" @change.prevent="toggle()" class="mr-2 d-none">
          <v-icon size="small" :icon="getState(ai.state).icon" />
          <span>{{ ai.title }}</span>
          <v-btn v-if="canDelete(ai)" color="warning" prepend-icon="mdi-delete" size="small" @click="deleteItem(ai)">{{ t('delete') }}</v-btn>
        </li>
      </v-item>
    </v-item-group>
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

    const editSelected = ref<number[]>([])
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
      editIsAllSelected,
      editSelected,
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
