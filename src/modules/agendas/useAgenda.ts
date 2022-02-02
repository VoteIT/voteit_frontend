import { computed, reactive } from 'vue'
import { useRoute } from 'vue-router'

import { dateify, orderBy } from '@/utils'

import { AgendaItem } from '@/modules/agendas/types'
import useMeeting from '../meetings/useMeeting'
import { agendaItemType, lastReadType } from './contentTypes'
import { agendaItemStates } from './workflowStates'
import { meetingType } from '../meetings/contentTypes'
import { agendaDeletedEvent } from './events'
import useChannel from '@/composables/useChannel'

export const agendaItems = reactive<Map<number, AgendaItem>>(new Map())
export const agendaItemsLastRead = reactive<Map<number, Date>>(new Map())

const channel = agendaItemType
  .onChanged(agendaItem => agendaItems.set(agendaItem.pk, dateify(agendaItem, 'related_modified')))
  .onDeleted(agendaItem => agendaDeletedEvent.emit(agendaItem.pk))
  .channel

// Delete as first event
agendaDeletedEvent.on(pk => {
  agendaItems.delete(pk)
  channel.leave(pk, { leaveDelay: 0 })
})

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
  .onLeave(uriOrPk => {
    const pk = typeof uriOrPk === 'string' ? Number(uriOrPk.split('/')[1]) : uriOrPk
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

export default function useAgenda () {
  const route = useRoute()
  const { meetingId } = useMeeting()

  function * iterAgenda (filter: (ai: AgendaItem) => boolean): Generator<AgendaItem> {
    for (const ai of agendaItems.values()) if (filter(ai)) yield ai
  }

  function getAgenda (meeting: number) {
    return orderBy(
      [...iterAgenda(ai => ai.meeting === meeting)],
      'order'
    )
  }
  const agenda = computed(() => {
    return getAgenda(meetingId.value)
  })

  const agendaStates = computed(() => {
    return agendaItemStates.map(state => {
      return {
        state,
        items: orderBy(
          [...iterAgenda(ai => ai.meeting === meetingId.value && ai.state === state.state)],
          'order'
        )
      }
    })
  })

  function getAgendaItem (agendaItem: number) {
    return agendaItems.get(agendaItem)
  }

  function getRelativeAgendaItem (agendaItem: AgendaItem, positions = 1) {
    const agenda = getAgenda(agendaItem.meeting)
    const index = agenda.indexOf(agendaItem)
    return agenda[index + positions]
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
    return !lastRead || agendaItem.related_modified > lastRead
  }

  const agendaId = computed(() => Number(route.params.aid))
  const agendaItem = computed(() => agendaItems.get(agendaId.value))
  const agendaItemLastRead = computed(() => agendaItemsLastRead.get(agendaId.value) ?? new Date(0)) // Default to epoch
  const previousAgendaItem = computed(() => agendaItem.value && getPreviousAgendaItem(agendaItem.value))
  const nextAgendaItem = computed(() => agendaItem.value && getNextAgendaItem(agendaItem.value))

  useChannel('agenda_item', agendaId)

  return {
    agenda,
    agendaId,
    agendaItem,
    agendaItemLastRead,
    agendaStates,
    previousAgendaItem,
    nextAgendaItem,
    getAgenda,
    getAgendaItem,
    getPreviousAgendaItem,
    getNextAgendaItem,
    hasNewItems
  }
}
