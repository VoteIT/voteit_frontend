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
    authToken: null,
    user: sessionStorage.user ? JSON.parse(sessionStorage.user) : null,
    loading: new Set(),
    initialized: false
  },
  getters: {
    isAuthenticated (state) {
      return Boolean(state.authToken)
    }
  },
  mutations: {
    setLoading (state, componentName) {
      state.loading.add(componentName)
    },
    setLoaded (state, componentName) {
      state.loading.delete(componentName)
      if (state.loading.size === 0) {
        setTimeout(_ => {
          state.initialized = true
        }, 500)
      }
    },
    setUser (state, user) {
      state.user = user
      if (user) {
        sessionStorage.user = JSON.stringify(user)
      } else {
        delete sessionStorage.user
      }
    },
    setAuthToken (state, key) {
      setAuthToken(key)
      state.authToken = key
    },
    setSocketState (state, value) {
      state.socketState = value
    }
  },
  actions: {
    authenticate ({ commit }, username) {
      restApi.get(`dev-login/${username}/`)
        .then(({ data }) => {
          commit('setAuthToken', data.key)
          setTimeout(() => {
            commit('setLoaded')
          }, 1500)
        })
        .catch(_ => {
          commit('setLoaded')
        })
    },
    logout ({ commit }) {
      // TODO more for prod
      commit('setAuthToken')
      commit('setUser')
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
