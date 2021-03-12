<template>
  <div>
    <h2>{{ t('agenda.order') }}</h2>
    <Draggable v-model="agendaItems" item-key="pk" >
      <template #item="{ element }">
        <div>
          <Icon sm :name="getState(element.state).icon" />
          <span>{{ element.title }}</span>
          <Icon sm>drag_handle</Icon>
        </div>
      </template>
    </Draggable>
  </div>
</template>

<script lang="ts">
import { computed } from 'vue'
import Draggable from 'vuedraggable'

import useAgenda from '@/composables/meeting/useAgenda'
import useMeeting from '@/composables/meeting/useMeeting'

import meetingType from '@/contentTypes/meeting'
import agendaItemType from '@/contentTypes/agendaItem'
import { AgendaItem } from '@/contentTypes/types'

export default {
  name: 'Agenda',
  path: 'agenda',
  icon: 'mdi-clipboard-list',
  inject: ['t'],
  components: {
    Draggable
  },
  setup () {
    const { getAgenda } = useAgenda()
    const { meetingId } = useMeeting()
    const meetingAPI = meetingType.getContentApi()
    const { getState } = agendaItemType.useWorkflows()

    const agendaItems = computed({
      get: () => getAgenda(meetingId.value),
      set: (agendaItems: AgendaItem[]) => {
        meetingAPI.action(meetingId.value, 'set_agenda_order', { order: agendaItems.map(ai => ai.pk) })
      }
    })
    return {
      agendaItems,
      getState
    }
  }
}
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
</style>
