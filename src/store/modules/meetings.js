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

export default {
  namespaced: true,
  state: {
    meetings: {},
    meetingList: [], // Sorted pk list
    agendas: {}
  },
  getters: {
    orderedMeetings (state) {
      return state.meetingList.map(id => state.meetings[id])
    }
  },
  mutations: {
    setMeetings (state, meetings) {
      state.meetingList = meetings.map(m => m.pk)
      meetings.forEach(m => {
        state.meetings[m.pk] = m
      })
    },
    updateMeeting (state, meeting) {
      state.meetings[meeting.pk] = meeting
      if (meeting.agenda_items) {
        sortAgenda(meeting.agenda_items)
        state.agendas[meeting.pk] = meeting.agenda_items
      }
    },
    updateAgenda (state, { t, p }) {
      const item = p.item || p // Can be only a pk
      const agenda = state.agendas[item.meeting] || []
      const index = agenda.findIndex(ai => ai.pk === item.pk)
      switch (t) {
        case 'agenda.added':
        case 'agenda.changed':
          if (!(item.meeting in state.agendas)) {
            state.agendas[item.meeting] = []
          }
          if (index === -1) {
            agenda.push(item)
          } else {
            agenda[index] = item
          }
          sortAgenda(agenda)
          break
        case 'agenda.deleted':
          // Probably rewrite using other structure
          Object.values(state.agendas)
            .forEach(agenda => {
              const index = agenda.findIndex(ai => ai.pk === item.pk)
              if (index !== -1) {
                agenda.splice(index, 1)
              }
            })
          break
      }
    }
  },
  actions: {
  },
  modules: {
  }
}
