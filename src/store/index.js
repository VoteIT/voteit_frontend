import { createStore } from 'vuex'

export default createStore({
  state: {
    meeting: {},
    agenda: []
  },
  mutations: {
    updateMeeting (state, data) {
      Object.assign(state.meeting, data)
    },
    updateAgenda (state, { t, p }) {
      switch (t) {
        case 'agenda.changed':
          p.items.forEach(agendaItem => {
            state.agenda = state.agenda.filter(ai => ai.pk !== agendaItem.pk) // Remove old and push as new
            state.agenda.push(agendaItem)
          })
          state.agenda.sort((a, b) => {
            if (a.order < b.order) {
              return -1
            }
            if (a.order > b.order) {
              return 1
            }
            return 0
          })
          break
        case 'agenda.deleted':
          p.items.forEach(deleted => {
            const index = state.agenda.findIndex(ai => ai.pk === deleted.pk)
            if (index !== -1) {
              state.agenda.splice(index, 1)
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
})
