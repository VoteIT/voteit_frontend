import wu from 'wu'
import { computed, onBeforeMount, reactive, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'

import useChannels from '../useChannels'
import useLoader from '../useLoader'

export const agendaItems = reactive(new Map()) // Map meeting pk to list of agenda items

/*
** TODO Rewrite to clear agenda when leaving meeting.
*/

useChannels('agenda')
  .updateMap(agendaItems)
  // .onChanged(item => {
  //   if (!agendas.has(item.meeting)) agendas.set(item.meeting, [])
  //   const agenda = agendas.get(item.meeting)
  //   const index = agenda.findIndex(ai => ai.pk === item.pk)
  //   if (index !== -1) agenda[index] = item
  //   else agenda.push(item)
  //   sortAgenda(agenda)
  // })
  // .onDeleted(item => {
  //   for (const agenda of agendas.values()) {
  //     const index = agenda.findIndex(ai => ai.pk === item.pk)
  //     if (index !== -1) {
  //       agenda.splice(index, 1)
  //       return
  //     }
  //   }
  // })

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

  // function setAgenda (meetingId, agendaItems) {
  //   sortAgenda(agendaItems)
  //   agendas.set(meetingId, agendaItems)
  // }
  function getAgenda (meetingPk) {
    const ais = [...wu(agendaItems.values()).filter(ai => ai.meeting === meetingPk)]
    keySort(ais, 'order')
    return ais
    // return agendas.get(meetingPk) || []
  }

  function getAgendaItem (agendaPk) {
    return agendaItems.get(agendaPk) || {}
    // agendaPk = agendaPk || agendaId.value
    // for (const agenda of agendas.values()) {
    //   const item = agenda.find(ai => ai.pk === agendaPk)
    //   if (item) {
    //     return item
    //   }
    // }
    // return {}
  }

  const agendaId = computed(_ => route && Number(route.params.aid))
  const agendaItem = computed(_ => getAgendaItem(agendaId.value))

  const loader = useLoader('useAgenda')
  const agendaChannel = useChannels('agenda_item')
  onBeforeMount(_ => {
    loader.subscribe(agendaChannel, agendaId.value)
  })
  onBeforeRouteLeave(_ => {
    agendaChannel.leave(agendaId.value)
  })
  watch(agendaId, (value, oldValue) => {
    agendaChannel.subscribe(value)
    agendaChannel.leave(oldValue)
  })

  return {
    // setAgenda,
    getAgenda,
    getAgendaItem,
    agendaId,
    agendaItem
  }
}
