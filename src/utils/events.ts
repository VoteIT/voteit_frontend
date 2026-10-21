import { Dialog, Modal } from '@/composables/types'
import TypedEvent from './TypedEvent'

export const DocumentVisibleEvent = new TypedEvent()
export const DocumentHiddenEvent = new TypedEvent()

/** Close the modal with that id, or the one showing if none is given */
export const closeModalEvent = new TypedEvent<number | void>()
export const openDialogEvent = new TypedEvent<Dialog>()
/** Open modals with openModal (@/utils/modal), which gives them their id */
export const openModalEvent = new TypedEvent<Modal & { id: number }>()
export const toggleNavDrawerEvent = new TypedEvent()
/**
 * The user picked another language. Requests already carry the new
 * Accept-Language header, so data the backend translates and we keep - state
 * names, method titles and the like - can be refetched from here.
 */
export const localeChangedEvent = new TypedEvent<string>()

/* c8 ignore next 4 */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') DocumentVisibleEvent.emit()
  if (document.visibilityState === 'hidden') DocumentHiddenEvent.emit()
})
