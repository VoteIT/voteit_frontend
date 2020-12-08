export default {
  namespaced: true,
  state: {
    all: [],
    pollStatus: new Map()
  },
  getters: {
    getMeetingPolls (state) {
      return id => state.all.filter(p => p.meeting === id)
    },
    getAgendaPolls (state) {
      return ai => state.all.filter(p => p.agenda_item === ai)
    },
    getPollStatus (state) {
      return pollId => state.pollStatus.get(pollId) || {}
    }
  },
  mutations: {
    setPolls (state, { meeting, polls }) {
      // Drop all polls for this meeting, then push all
      state.all = state.all.filter(p => p.meeting !== meeting)
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
          state.pollStatus.set(item.pk, item)
          break
      }
    }
  },
  actions: {
  },
  modules: {
  }
}
