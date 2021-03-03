import wu from 'wu'
import { computed, onBeforeMount, reactive, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'

import { orderBy } from '@/utils'

import agendaItemType from '@/contentTypes/agendaItem'
import meetingType from '@/contentTypes/meeting'

import useLoader from '../useLoader'
import { AgendaItem } from '@/contentTypes/types'
import Channel from '@/contentTypes/Channel'
import TypedEvent from '@/utils/TypedEvent'

export const agendaItems = reactive<Map<number, AgendaItem>>(new Map())
export const agendaDeletedEvent = new TypedEvent<number>()

const channel = agendaItemType.getChannel()
  .onChanged(agendaItem => agendaItems.set(agendaItem.pk, agendaItem))
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

export default function useAgenda () {
  const route = useRoute()

  function getAgenda (meeting: number) {
    const ais = [...wu(agendaItems.values()).filter(ai => ai.meeting === meeting)]
    return orderBy(ais, 'order')
  }

  function getAgendaItem (agendaItem: number) {
    return agendaItems.get(agendaItem)
  }

  const agendaId = computed(() => route && Number(route.params.aid))
  const agendaItem = computed(() => getAgendaItem(agendaId.value))

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
    // setAgenda,
    getAgenda,
    getAgendaItem,
    agendaId,
    agendaItem
  }
}
