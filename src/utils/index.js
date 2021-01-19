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

class DefaultMap extends Map {
  get (key) {
    if (!this.has(key)) this.set(key, this.default())
    return super.get(key)
  }

  constructor (defaultFunction, entries) {
    super(entries)
    this.default = defaultFunction
  }
}

export {
  Socket,
  ProgressPromise,
  DefaultMap,
  uriToPayload,
  slugify,
  restApi,
  emitter
}
