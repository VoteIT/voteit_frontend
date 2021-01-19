import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import useChannels from '../useChannels'

const agendas = ref(new Map()) // Map meeting id to list of agenda items

useChannels('agenda')
  .onChange(item => {
    if (!agendas.value.has(item.meeting)) agendas.value.set(item.meeting, [])
    const agenda = agendas.value.get(item.meeting)
    const index = agenda.findIndex(ai => ai.pk === item.pk)
    if (index !== -1) agenda[index] = item
    else agenda.push(item)
    sortAgenda(agenda)
  })
  .onDelete(item => {
    for (const agenda of agendas.value.values()) {
      const index = agenda.findIndex(ai => ai.pk === item.pk)
      if (index !== -1) {
        agenda.splice(index, 1)
        return
      }
    }
  })
  // .onUpdate(({ t, p }) => {
  //   const item = p
  //   const agenda = agendas.value.get(item.meeting, item)
  //   const index = agenda.findIndex(ai => ai.pk === item.pk)
  //   switch (t) {
  //     case 'agenda.changed':
  //     case 'agenda.added':
  //       if (index !== -1) {
  //         agenda.splice(index, 1)
  //       }
  //       agenda.push(item)
  //       break
  //     case 'agenda.deleted':
  //       if (index !== -1) {
  //         agenda.splice(index, 1)
  //       }
  //       break
  //   }
  // })

function sortAgenda (items) {
  items.sort((a, b) => {
    if (a.order < b.order) {
      return -1
    }
    if (a.order > b.order) {
      return 1
    }
    return 0
  })
}

export default function useAgenda () {
  const route = useRoute()

  function setAgenda (meetingId, agendaItems) {
    sortAgenda(agendaItems)
    agendas.value.set(meetingId, agendaItems)
  }
  function getAgenda (meetingId) {
    return agendas.value.get(meetingId) || []
  }

  function getAgendaItem (agendaId) {
    for (const agenda of agendas.value.values()) {
      const item = agenda.find(ai => ai.pk === agendaId)
      if (item) {
        return item
      }
    }
    return {}
  }

  const agendaId = computed(_ => Number(route.params.aid))
  const agendaItem = computed(_ => getAgendaItem(agendaId.value))

  return {
    setAgenda,
    getAgenda,
    agendaId,
    agendaItem
  }
}
