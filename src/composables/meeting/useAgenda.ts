import wu from 'wu'
import { computed, onBeforeMount, reactive, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'

import { dateify, orderBy } from '@/utils'

import agendaItemType from '@/contentTypes/agendaItem'
import meetingType from '@/contentTypes/meeting'

import useLoader from '../useLoader'
import { AgendaItem } from '@/contentTypes/types'
import Channel from '@/contentTypes/Channel'
import TypedEvent from '@/utils/TypedEvent'
import { LastRead } from '@/utils/types'

export const agendaItems = reactive<Map<number, AgendaItem>>(new Map())
export const agendaDeletedEvent = new TypedEvent<number>()
export const agendaItemsLastRead = reactive<Map<number, Date>>(new Map())

const channel = agendaItemType.getChannel()
  .onChanged(agendaItem => agendaItems.set(agendaItem.pk, dateify(agendaItem, 'related_modified')))
  .onDeleted(agendaItem => agendaDeletedEvent.emit(agendaItem.pk))

// Delete as first event
agendaDeletedEvent.on(pk => {
  agendaItems.delete(pk)
  channel.leave(pk, { leaveDelay: 0 })
})

/*
** Clear agenda when leaving meeting.
*/
meetingType.getChannel()
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
new Channel('moderators')
  .onLeave(uriOrPk => {
    const pk = typeof uriOrPk === 'string' ? Number(uriOrPk.split('/')[1]) : uriOrPk
    for (const agendaItem of agendaItems.values()) {
      if (agendaItem.meeting === pk && agendaItem.state === 'private') {
        agendaDeletedEvent.emit(agendaItem.pk)
      }
    }
  })

new Channel('last_read')
  .onChanged(item => {
    const lastRead = item as LastRead
    agendaItemsLastRead.set(lastRead.agenda_item, new Date(lastRead.timestamp))
  })

export default function useAgenda () {
  const route = useRoute()

  function getAgenda (meeting: number) {
    const ais = [...wu(agendaItems.values()).filter(ai => ai.meeting === meeting)]
    return orderBy(ais, 'order')
  }

  function getAgendaItem (agendaItem: number) {
    return agendaItems.get(agendaItem)
  }

  function hasNewItems (agendaItem: AgendaItem): boolean {
    // If no content, there are no new items
    if (!agendaItem.related_modified) return false
    const lastRead = agendaItemsLastRead.get(agendaItem.pk)
    // Else, if no lastRead or set to earlier time, there are new items
    return !lastRead || agendaItem.related_modified > lastRead
  }

  const agendaId = computed(() => route && Number(route.params.aid))
  const agendaItem = computed(() => getAgendaItem(agendaId.value))
  const agendaItemLastRead = computed(() => agendaItemsLastRead.get(agendaId.value))

  const loader = useLoader('useAgenda')
  onBeforeMount(() => {
    agendaId.value && loader.subscribe(channel, agendaId.value)
  })
  onBeforeRouteLeave(() => {
    agendaId.value && channel.leave(agendaId.value)
  })
  watch(agendaItem, (value, oldValue) => {
    value && channel.subscribe(value.pk)
    oldValue && channel.leave(oldValue.pk)
  })

  return {
    getAgenda,
    getAgendaItem,
    hasNewItems,
    agendaId,
    agendaItem,
    agendaItemLastRead
  }
}
