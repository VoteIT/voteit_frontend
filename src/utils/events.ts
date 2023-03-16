import { Alert, Dialog, Modal } from '@/composables/types'
import TypedEvent from './TypedEvent'

export const DocumentVisibleEvent = new TypedEvent()
export const DocumentHiddenEvent = new TypedEvent()

export const clearAlertsEvent = new TypedEvent()
export const closeModalEvent = new TypedEvent()
export const openAlertEvent = new TypedEvent<Alert | string>()
export const openDialogEvent = new TypedEvent<Dialog>()
export const openModalEvent = new TypedEvent<Modal>()
export const toggleNavDrawerEvent = new TypedEvent()

/* c8 ignore next 4 */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') DocumentVisibleEvent.emit()
  if (document.visibilityState === 'hidden') DocumentHiddenEvent.emit()
})
