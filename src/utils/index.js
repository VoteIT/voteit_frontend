import ProgressPromise from './ProgressPromise'
import Socket from './Socket'
import { restApi } from './api'
import mitt from 'mitt'

function uriToPayload (uri) {
  // Convert internal resource identifier to subscription payload object
  if (typeof uri === 'string') {
    const [ct, pk] = uri.split('/')
    return {
      channel_type: ct,
      pk
    }
  }
}

function slugify (text) {
  return typeof text === 'string' && text.toLowerCase().replaceAll(/\s+/g, '-')
}

const emitter = mitt()

export {
  Socket,
  ProgressPromise,
  uriToPayload,
  slugify,
  restApi,
  emitter
}
