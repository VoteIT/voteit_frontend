import { createStore } from 'vuex'
import meetings from './modules/meetings'
import proposals from './modules/proposals'
import polls from './modules/polls'

// baseType: mutationPath
const updateObjectMapping = {
  agenda: 'meetings/updateAgenda',
  proposal: 'proposals/updateProposal',
  discussion: 'discussions/updateDiscussion',
  poll: 'polls/updatePoll'
}
// If handler for base type is missing that will be logged to console, unless defined here.
const updateObjectIngore = new Set([
  'testing', 'channel'
])

export default createStore({
  state: {
    socketState: true
  },
  mutations: {
    setSocketState (state, value) {
      state.socketState = value
    }
  },
  actions: {
    updateObject ({ commit }, payload) {
      // Handle object updates from websocket connection.
      const baseType = payload.t.split('.')[0]
      if (baseType in updateObjectMapping) {
        commit(updateObjectMapping[baseType], payload)
      } else if (!updateObjectIngore.has(baseType)) {
        console.log(`No object update handler for type ${baseType}`, payload)
      }
    }
  },
  modules: {
    meetings,
    proposals,
    polls
  }
})
