import { createStore } from 'vuex'
import meetings from './modules/meetings'
import proposals from './modules/proposals'
import polls from './modules/polls'
import { restApi, setAuthToken } from '../utils'

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
    socketState: false,
    isAuthenticated: false
  },
  mutations: {
    setAuthenticated (state, value) {
      state.isAuthenticated = value
    },
    setSocketState (state, value) {
      state.socketState = value
    }
  },
  actions: {
    authenticate ({ commit }) {
      restApi.post('dev-login/')
        .then(({ data }) => {
          setAuthToken(data.key)
          commit('setAuthenticated', true)
        })
    },
    logout ({ commit }) {
      // TODO more for prod
      setAuthToken()
      commit('setAuthenticated', false)
    },
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
