export default {
  namespaced: true,
  state: {
    all: []
  },
  getters: {
    agendaProposals (state) {
      return ai => state.all.filter(p => p.agenda_item === ai)
    }
  },
  mutations: {
    setProposals (state, { ai, proposals }) {
      state.all = state.all.filter(p => p.agenda_item !== ai)
      Array.prototype.push.apply(state.all, proposals)
    },
    updateProposal (state, { t, p }) {
      const item = p.item || p // Can be only a pk
      const index = state.all.findIndex(p => p.pk === item.pk)
      console.log(t, p, index)
      switch (t) {
        case 'proposal.changed':
        case 'proposal.added':
          if (index !== -1) {
            state.all.splice(index, 1)
          }
          state.all.push(item)
          break
        case 'proposal.deleted':
          if (index !== -1) {
            state.all.splice(index, 1)
          }
          break
      }
    }
  },
  actions: {
  },
  modules: {
  }
}
