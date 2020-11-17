export default {
  namespaced: true,
  state: {
    all: {}
  },
  getters: {
    agendaProposals (state) {
      return ai => Object.values(state.all).filter(p => p.agenda_item === ai)
    }
  },
  mutations: {
    setProposals (state, proposals) {
      proposals.forEach(p => {
        state.all[p.pk] = p
      })
    },
    updateProposal (state, { t, p }) {
      if (!t.startsWith('proposal.')) {
        return
      }
      const item = p.item
      switch (t) {
        case 'proposal.changed':
        case 'proposal.added':
          state.all[item.pk] = item
          break
        case 'proposal.deleted':
          delete state.all[p.pk]
          break
      }
    }
  },
  actions: {
  },
  modules: {
  }
}
