import { filter } from 'itertools'
import { orderBy } from 'lodash'
import { computed, reactive, Ref } from 'vue'
import { useRoute } from 'vue-router'

import { AgendaBody, AgendaItem } from '@/modules/agendas/types'
import { agendaBodyType, agendaItemType, lastReadType } from './contentTypes'
import { agendaItemStates } from './workflowStates'
import { meetingType } from '../meetings/contentTypes'
import { agendaDeletedEvent } from './events'
import { Maybe } from 'itertools/types'

const agendaBodies = reactive<Map<number, AgendaBody>>(new Map())
export const agendaItems = reactive<Map<number, AgendaItem>>(new Map())
export const agendaItemsLastRead = reactive<Map<number, Date>>(new Map())

agendaItemType
  .onChanged(agendaItem => agendaItems.set(agendaItem.pk, agendaItem))
  .onDeleted(agendaItem => agendaDeletedEvent.emit(agendaItem.pk))

// Delete as first event
agendaDeletedEvent.on(pk => {
  agendaItems.delete(pk)
  agendaBodies.delete(pk)
})

agendaBodyType.updateMap(agendaBodies)

/*
** Clear agenda when leaving meeting.
*/
meetingType.channel
  .onLeave(pk => {
    for (const agendaItem of agendaItems.values()) {
      if (agendaItem.meeting === pk) {
        agendaDeletedEvent.emit(agendaItem.pk)
        agendaItems.delete(agendaItem.pk)
      }
    }
  })

/*
** Clear private agenda items when leaving moderators channel.
*/
meetingType.getChannel('moderators')
  .onLeave(pk => {
    for (const agendaItem of agendaItems.values()) {
      if (agendaItem.meeting === pk && agendaItem.state === 'private') {
        agendaDeletedEvent.emit(agendaItem.pk)
      }
    }
  })

lastReadType
  .onChanged(payload => {
    agendaItemsLastRead.set(payload.agenda_item, new Date(payload.timestamp))
  })

// Must supply meetingId
// Optionally supply a tag for using filteredAgenda
export default function useAgenda (meetingId: Ref<number>, tag?: Ref<string | undefined>) {
  const route = useRoute()

  const agenda = computed(() => {
    // Filter on meetingId
    return orderBy(
      filter(
        agendaItems.values(),
        ai => ai.meeting === meetingId.value
      ),
      ['order']
    )
  })

  const filteredAgenda = computed(() => {
    // Filter on tag, if supplied
    return agenda.value.filter(
      ai => !tag?.value || ai.tags.includes(tag.value)
    )
  })

  const agendaStates = computed(() => {
    return agendaItemStates.map(state => {
      return {
        state,
        items: filter(
          agenda.value,
          ai => ai.state === state.state
        )
      }
    })
  })

  function getAgendaItem (agendaItem: number) {
    return agendaItems.get(agendaItem)
  }

  function getAgendaBody (agendaItem: number) {
    return agendaBodies.get(agendaItem)
  }

  function getRelativeAgendaItem (agendaItem: AgendaItem, positions = 1): Maybe<AgendaItem> {
    const index = agenda.value.indexOf(agendaItem)
    return agenda.value[index + positions]
  }
  function getPreviousAgendaItem (agendaItem: AgendaItem) {
    return getRelativeAgendaItem(agendaItem, -1)
  }
  function getNextAgendaItem (agendaItem: AgendaItem) {
    return getRelativeAgendaItem(agendaItem)
  }

  function hasNewItems (agendaItem: AgendaItem): boolean {
    // If no content, there are no new items
    if (!agendaItem.related_modified) return false
    const lastRead = agendaItemsLastRead.get(agendaItem.pk)
    // Else, if no lastRead or set to earlier time, there are new items
    return !lastRead || new Date(agendaItem.related_modified) > lastRead
  }

  const agendaId = computed(() => Number(route.params.aid))
  const agendaItem = computed(() => agendaItems.get(agendaId.value))
  const agendaItemLastRead = computed(() => agendaItemsLastRead.get(agendaId.value) ?? new Date(0)) // Default to epoch
  const previousAgendaItem = computed(() => agendaItem.value && getPreviousAgendaItem(agendaItem.value))
  const nextAgendaItem = computed(() => agendaItem.value && getNextAgendaItem(agendaItem.value))

  return {
    agenda,
    agendaId,
    agendaItem,
    agendaItemLastRead,
    agendaStates,
    filteredAgenda,
    previousAgendaItem,
    nextAgendaItem,
    getAgendaItem,
    getAgendaBody,
    getPreviousAgendaItem,
    getNextAgendaItem,
    hasNewItems
  }
}
