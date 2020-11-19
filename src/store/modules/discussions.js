export default {
  namespaced: true,
  state: {
    all: []
  },
  getters: {
    agendaDiscussions (state) {
      return ai => state.all.filter(d => d.agenda_item === ai)
    }
  },
  mutations: {
    setDiscussions (state, { ai, discussions }) {
      // Allow keeping discussions from other ais as cache
      state.all = state.all.filter(d => d.agenda_item !== ai)
      Array.prototype.push.apply(state.all, discussions)
    },
    updateDiscussion (state, { t, p }) {
      const item = p.item || p // Can be only a pk
      const index = state.all.findIndex(d => d.pk === item.pk)
      switch (t) {
        case 'discussion_post.changed':
        case 'discussion_post.added':
          if (index !== -1) {
            state.all.splice(index, 1)
          }
          state.all.push(item)
          break
        case 'discussion_post.deleted':
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
