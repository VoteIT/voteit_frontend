import { Dialog } from '@/composables/types'
import { SubscribePayload } from './types'
import _slugify from 'slugify'
import { openDialogEvent } from './events'

export function uriToPayload (uri: string): SubscribePayload {
  // Convert internal resource identifier to subscription payload object
  const [ct, pk] = uri.split('/')
  return {
    channel_type: ct,
    pk: Number(pk)
  }
}

export function slugify (text: string) {
  return _slugify(text, {
    lower: true,
    locale: document.documentElement.lang
  }).replaceAll(/[^\w-]/g, '')
}

export function dateify<T> (obj: any, attributes: string | string[] = 'created'): T {
  if (typeof attributes === 'string') attributes = [attributes]
  attributes.forEach(attrName => {
    // Respect null dates
    obj[attrName] = obj[attrName] && new Date(obj[attrName])
  })
  return obj
}

export function orderBy<T> (objects: T[], getter: (object: T) => any, reversed?: boolean): T[]
export function orderBy<T> (objects: T[], attribute?: string, reversed?: boolean): T[]
export function orderBy<T> (objects: T[], attributeOrGetter: ((object: T) => any) | string = 'created', reversed?: boolean): T[] {
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

export function stripHTML (html: string) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

export async function dialogQuery (text: string): Promise<undefined>
export async function dialogQuery (dialog: Omit<Dialog, 'resolve'>): Promise<undefined>
export async function dialogQuery (dialogOrText: Omit<Dialog, 'resolve'> | string) {
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

export function * mapFilter<T> (map: Map<unknown, T>, filter: (obj: T) => boolean) {
  for (const o of map.values()) {
    if (filter(o)) yield o
  }
}

export function mapFind<T> (map: Map<unknown, T>, filter: (obj: T) => boolean) {
  for (const o of map.values()) {
    if (filter(o)) return o
  }
}
