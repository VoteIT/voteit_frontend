import ProgressPromise from './ProgressPromise'
import Socket from './Socket'

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

export {
  Socket,
  ProgressPromise,
  uriToPayload
}
