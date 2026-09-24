import { Alert, Dialog, Modal } from '@/composables/types'
import TypedEvent from './TypedEvent'

export const DocumentVisibleEvent = new TypedEvent()
export const DocumentHiddenEvent = new TypedEvent()

/** Close the modal with that id, or the one showing if none is given */
export const closeModalEvent = new TypedEvent<number | void>()
/**
 * Emit an Alert object, or a plain string as a shortcut:
 * - No prefix → info level  e.g. `openAlertEvent.emit('Saved')`
 * - `'*'` prefix  → warning  e.g. `openAlertEvent.emit('*Check your input')`
 * - `'^'` prefix  → error    e.g. `openAlertEvent.emit('^Something went wrong')`
 */
export const openAlertEvent = new TypedEvent<Alert | string>()
export const openDialogEvent = new TypedEvent<Dialog>()
/** Open modals with openModal (@/utils/modal), which gives them their id */
export const openModalEvent = new TypedEvent<Modal & { id: number }>()
export const toggleNavDrawerEvent = new TypedEvent()

/* c8 ignore next 4 */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') DocumentVisibleEvent.emit()
  if (document.visibilityState === 'hidden') DocumentHiddenEvent.emit()
})
