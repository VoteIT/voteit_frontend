import DefaultMap from './DefaultMap'
import TypedEvent from './TypedEvent'
import ProgressPromise from './ProgressPromise'
import Socket from './Socket'
import restApi from './restApi'
import { Alert, Dialog, Modal } from '@/composables/types'

function uriToPayload (uri: string) {
  // Convert internal resource identifier to subscription payload object
  const [ct, pk] = uri.split('/')
  return {
    channel_type: ct,
    pk
  }
}

function slugify (text: string) {
  return text.toLowerCase().replaceAll(/\s+/g, '-')
}

function dateify<T> (obj: any, attributes: string | string[] = 'created'): T {
  if (typeof attributes === 'string') attributes = [attributes]
  attributes.forEach(attrName => {
    obj[attrName] = new Date(obj[attrName])
  })
  return obj
}

function orderBy<T> (objects: T[], attribute = 'created'): T[] {
  objects.sort((objA: any, objB: any) => {
    if (objA[attribute] > objB[attribute]) return 1
    if (objA[attribute] < objB[attribute]) return -1
    return 0
  })
  return objects
}

const openAlertEvent = new TypedEvent<Alert | string>()
const openDialogEvent = new TypedEvent<Dialog>()
const openModalEvent = new TypedEvent<Modal>()
const closeModalEvent = new TypedEvent()

async function dialogQuery (text: string): Promise<undefined>
async function dialogQuery (dialog: Dialog): Promise<undefined>
async function dialogQuery (dialogOrText: Dialog | string) {
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

export {
  DefaultMap,
  ProgressPromise,
  Socket,
  dateify,
  dialogQuery,
  orderBy,
  slugify,
  uriToPayload,
  openAlertEvent,
  openDialogEvent,
  openModalEvent,
  closeModalEvent,
  restApi
}
