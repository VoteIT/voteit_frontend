import { createStore } from 'vuex'
import meetings from './modules/meetings'
import proposals from './modules/proposals'
import discussions from './modules/discussions'
import polls from './modules/polls'
import { restApi, setAuthToken } from '../utils'

// baseType: mutationPath
const updateObjectMapping = {
  agenda: 'meetings/updateAgenda',
  proposal: 'proposals/updateProposal',
  discussion_post: 'discussions/updateDiscussion',
  poll: 'polls/updatePoll'
}
// If handler for base type is missing that will be logged to console, unless defined here.
const updateObjectIngore = new Set([
  'testing', 'channel'
])

export default createStore({
  state: {
    socketState: false,
    authToken: null
  },
  getters: {
    isAuthenticated (state) {
      return Boolean(state.authToken)
    }
  },
  mutations: {
    setAuthToken (state, key) {
      setAuthToken(key)
      state.authToken = key
    },
    setSocketState (state, value) {
      state.socketState = value
    }
  },
  actions: {
    authenticate ({ commit }) {
      restApi.post('dev-login/')
        .then(({ data }) => {
          commit('setAuthToken', data.key)
        })
    },
    logout ({ commit }) {
      // TODO more for prod
      commit('setAuthToken')
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
    polls,
    discussions
  }
})
