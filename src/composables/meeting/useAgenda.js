import wu from 'wu'
import { computed, onBeforeMount, reactive, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'

import agendaItemType from '@/contentTypes/agendaItem'

import useLoader from '../useLoader'

export const agendaItems = reactive(new Map()) // Map meeting pk to list of agenda items

/*
** TODO Rewrite to clear agenda when leaving meeting.
*/

const channel = agendaItemType.useChannels()
  .updateMap(agendaItems)

function keySort (items, key) {
  items.sort((a, b) => {
    if (a[key] < b[key]) {
      return -1
    }
    if (a[key] > b[key]) {
      return 1
    }
    return 0
  })
}

export default function useAgenda () {
  const route = useRoute()

  function getAgenda (meetingPk) {
    const ais = [...wu(agendaItems.values()).filter(ai => ai.meeting === meetingPk)]
    keySort(ais, 'order')
    return ais
  }

  function getAgendaItem (agendaPk) {
    return agendaItems.get(agendaPk) || {}
  }

  const agendaId = computed(_ => route && Number(route.params.aid))
  const agendaItem = computed(_ => getAgendaItem(agendaId.value))

  const loader = useLoader('useAgenda')
  onBeforeMount(_ => {
    loader.subscribe(channel, agendaId.value)
  })
  onBeforeRouteLeave(_ => {
    channel.leave(agendaId.value)
  })
  watch(agendaId, (value, oldValue) => {
    channel.subscribe(value)
    channel.leave(oldValue)
  })

  return {
    // setAgenda,
    getAgenda,
    getAgendaItem,
    agendaId,
    agendaItem
  }
}
