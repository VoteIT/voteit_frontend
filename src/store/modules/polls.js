export default {
  namespaced: true,
  state: {
    all: [],
    pollStatus: {}
  },
  getters: {
    meetingPolls (state) {
      return id => state.all.filter(p => p.meeting === id)
    },
    agendaPolls (state) {
      return ai => state.all.filter(p => p.agenda_item === ai)
    }
  },
  mutations: {
    setPolls (state, { meeting, polls }) {
      state.all = state.all.filter(p => p.agenda_item !== meeting)
      Array.prototype.push.apply(state.all, polls)
    },
    updatePoll (state, { t, p }) {
      const item = p.item || p // Can be only a pk
      const index = state.all.findIndex(p => p.pk === item.pk)
      switch (t) {
        case 'poll.changed':
        case 'poll.added':
          if (index !== -1) {
            state.all.splice(index, 1)
          }
          state.all.push(item)
          break
        case 'poll.deleted':
          if (index !== -1) {
            state.all.splice(index, 1)
          }
          break
        case 'poll.status':
          state.pollStatus[item.pk] = item
          break
      }
    }
  },
  actions: {
  },
  modules: {
  }
}
