import { createStore } from 'vuex'
import meetings from './modules/meetings'
import proposals from './modules/proposals'

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
  },
  modules: {
    meetings,
    proposals
  }
})
