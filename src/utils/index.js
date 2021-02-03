import ProgressPromise from './ProgressPromise.js'
import Socket from './Socket.js'
import restApi from './restApi.js'
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

function dateify (object, attributes) {
  if (typeof attributes === 'string') attributes = [attributes]
  attributes = attributes || ['created']
  attributes.forEach(attrName => {
    object[attrName] = new Date(object[attrName])
  })
  return object
}

function orderBy (objects, attribute = 'created') {
  objects.sort((objA, objB) => {
    if (objA[attribute] > objB[attribute]) return 1
    if (objA[attribute] < objB[attribute]) return -1
    return 0
  })
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
  dateify,
  orderBy,
  restApi,
  emitter
}
