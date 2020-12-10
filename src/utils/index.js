import ProgressPromise from './ProgressPromise'
import Socket from './Socket'
import { setAuthToken, restApi } from './api'
import mitt from 'mitt'

function uriToPayload (uri) {
  // Convert internal resource identifier to subscription payload object
  if (typeof uri === 'string') {
    const path = uri.split('/')
    return {
      channel_type: path[0],
      pk: path[1]
    }
  }
}

const emitter = mitt()

export {
  Socket,
  ProgressPromise,
  uriToPayload,
  setAuthToken,
  restApi,
  emitter
}
