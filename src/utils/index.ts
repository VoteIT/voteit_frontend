import ProgressPromise from './ProgressPromise'
import Socket from './Socket'
import restApi from './restApi'
import mitt from 'mitt'
import { BaseContent } from '@/contentTypes/types'
import { Payload } from './types'

function uriToPayload (uri: string) {
  // Convert internal resource identifier to subscription payload object
  const [ct, pk] = uri.split('/')
  return {
    channel_type: ct,
    pk
  }
}

function slugify (text: string) {
  return typeof text === 'string' && text.toLowerCase().replaceAll(/\s+/g, '-')
}

function dateify (obj: Payload, attributes: string | string[] = 'created') {
  if (typeof attributes === 'string') attributes = [attributes]
  attributes.forEach(attrName => {
    obj[attrName] = new Date(obj[attrName])
  })
  return obj
}

function orderBy (objects: BaseContent[], attribute = 'created'): BaseContent[] {
  objects.sort((objA, objB) => {
    if (objA[attribute] > objB[attribute]) return 1
    if (objA[attribute] < objB[attribute]) return -1
    return 0
  })
  return objects
}

const emitter = mitt()

class DefaultMap<K, T> extends Map<K, T> {
  default: () => any

  get (key: K): T {
    if (!this.has(key)) this.set(key, this.default())
    return super.get(key) as T
  }

  constructor (defaultFunction: () => T) {
    super()
    this.default = defaultFunction
  }
}

async function dialogQuery (dialogOrText: object | string) {
  return new Promise(resolve => {
    if (typeof dialogOrText === 'string') {
      dialogOrText = {
        title: dialogOrText,
        resolve
      }
    }
    emitter.emit('dialog-open', dialogOrText)
  })
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
  emitter,
  dialogQuery
}
