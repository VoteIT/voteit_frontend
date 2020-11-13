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
    },
    updateAgenda (state, { t, p }) {
      const agendasChanged = new Set() // Order these
      switch (t) {
        case 'agenda.changed':
          p.items.forEach(changed => {
            agendasChanged.add(changed.meeting)
            if (!(changed.meeting in state.agendas)) {
              state.agendas[changed.meeting] = []
            }
            const agenda = state.agendas[changed.meeting]
            const index = agenda.findIndex(ai => ai.pk === changed.pk)
            if (index === -1) {
              agenda.push(changed)
            } else {
              agenda[index] = changed
            }
          })
          break
        case 'agenda.deleted':
          p.items.forEach(deleted => {
            const agenda = state.agendas[deleted.meeting] || []
            const index = agenda.findIndex(ai => ai.pk === deleted.pk)
            if (index !== -1) {
              agenda.splice(index, 1)
            }
          })
          break
      }
      for (const id of agendasChanged) {
        state.agendas[id].sort((a, b) => {
          if (a.order < b.order) {
            return -1
          }
          if (a.order > b.order) {
            return 1
          }
          return 0
        })
      }
    }
  },
  actions: {
  },
  modules: {
  }
}
