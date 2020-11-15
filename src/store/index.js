import { createStore } from 'vuex'
import meetings from './modules/meetings'

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
    meetings
  }
})
