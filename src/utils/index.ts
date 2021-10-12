import DefaultMap from './DefaultMap'
import TypedEvent from './TypedEvent'
import ProgressPromise from './ProgressPromise'
import Socket from './Socket'
import restApi from './restApi'
import { Alert, Dialog, Modal } from '@/composables/types'
import { SubscribePayload } from './types'
import _slugify from 'slugify'

function uriToPayload (uri: string): SubscribePayload {
  // Convert internal resource identifier to subscription payload object
  const [ct, pk] = uri.split('/')
  return {
    channel_type: ct,
    pk: Number(pk)
  }
}

function slugify (text: string) {
  return _slugify(text, {
    lower: true,
    locale: document.documentElement.lang
  }).replaceAll(/[^\w-]/g, '')
}

function dateify<T> (obj: any, attributes: string | string[] = 'created'): T {
  if (typeof attributes === 'string') attributes = [attributes]
  attributes.forEach(attrName => {
    // Respect null dates
    obj[attrName] = obj[attrName] && new Date(obj[attrName])
  })
  return obj
}

function orderBy<T> (objects: T[], getter: (object: T) => any, reversed?: boolean): T[]
function orderBy<T> (objects: T[], attribute?: string, reversed?: boolean): T[]
function orderBy<T> (objects: T[], attributeOrGetter: ((object: T) => any) | string = 'created', reversed?: boolean): T[] {
  const direction = reversed ? -1 : 1
  const getter = typeof attributeOrGetter === 'string' ? (object: any) => object[attributeOrGetter] : attributeOrGetter
  objects.sort((objA: T, objB: T) => {
    const valA = getter(objA)
    const valB = getter(objB)
    if (valA > valB) return direction
    if (valA < valB) return -direction
    return 0
  })
  return objects
}

const openAlertEvent = new TypedEvent<Alert | string>()
const openDialogEvent = new TypedEvent<Dialog>()
const openModalEvent = new TypedEvent<Modal>()
const closeModalEvent = new TypedEvent()
const toggleNavDrawerEvent = new TypedEvent()

function stripHTML (html: string) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

async function dialogQuery (text: string): Promise<undefined>
async function dialogQuery (dialog: Omit<Dialog, 'resolve'>): Promise<undefined>
async function dialogQuery (dialogOrText: Omit<Dialog, 'resolve'> | string) {
  return new Promise(resolve => {
    if (typeof dialogOrText === 'string') {
      openDialogEvent.emit({
        title: dialogOrText,
        resolve
      })
    } else {
      openDialogEvent.emit({
        ...dialogOrText,
        resolve
      })
    }
  })
}

function * mapFilter<T> (map: Map<unknown, T>, filter: (obj: T) => boolean) {
  for (const o of map.values()) {
    if (filter(o)) yield o
  }
}

function mapFind<T> (map: Map<unknown, T>, filter: (obj: T) => boolean) {
  for (const o of map.values()) {
    if (filter(o)) return o
  }
}

export {
  DefaultMap,
  ProgressPromise,
  Socket,
  dateify,
  dialogQuery,
  mapFilter,
  mapFind,
  orderBy,
  slugify,
  stripHTML,
  uriToPayload,
  openAlertEvent,
  openDialogEvent,
  openModalEvent,
  closeModalEvent,
  toggleNavDrawerEvent,
  restApi
}
