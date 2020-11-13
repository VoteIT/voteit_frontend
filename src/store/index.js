import { createStore } from 'vuex'
import meetings from './modules/meetings'

export default createStore({
  state: {
    socketState: null
  },
  mutations: {
    setSocketState (state, value) {
      state.socketState = value
    }
  },
  actions: {
  },
  modules: {
    meetings
  }
})
