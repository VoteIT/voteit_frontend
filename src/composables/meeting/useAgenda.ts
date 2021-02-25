import wu from 'wu'
import { computed, onBeforeMount, reactive, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'

import { orderBy } from '@/utils'

import agendaItemType from '@/contentTypes/agendaItem'
import meetingType from '@/contentTypes/meeting'

import useLoader from '../useLoader'
import { AgendaItem } from '@/contentTypes/types'
import Channel from '@/contentTypes/Channel'

export const agendaItems = reactive<Map<number, AgendaItem>>(new Map())

const channel = agendaItemType.useChannels()
  .updateMap(agendaItems)
  .onDeleted(agendaItem => {
    agendaItems.delete(agendaItem.pk)
  })

/*
** Clear agenda when leaving meeting.
*/
meetingType.useChannels()
  .onLeave(pk => {
    for (const agendaItem of agendaItems.values()) {
      if (agendaItem.meeting === pk) {
        agendaItems.delete(agendaItem.pk)
      }
    }
  })

/*
** Clear private agenda items when leaving moderators channel.
*/
new Channel('moderators')
  .onLeave(pk => {
    for (const agendaItem of agendaItems.values()) {
      if (agendaItem.meeting === pk && agendaItem.state === 'private') {
        agendaItems.delete(agendaItem.pk)
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
    return agendaItems.get(agendaItem) || {}
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
  watch(agendaId, (value, oldValue) => {
    value && channel.subscribe(value)
    oldValue && channel.leave(oldValue)
  })

  return {
    // setAgenda,
    getAgenda,
    getAgendaItem,
    agendaId,
    agendaItem
  }
}
