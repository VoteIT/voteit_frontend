import { createStore } from 'vuex'

export default createStore({
  state: {
    agenda: []
  },
  mutations: {
    updateAgenda (state, agenda) {
      agenda.items.forEach(agendaItem => {
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
    }
  },
  actions: {
  },
  modules: {
  }
})
