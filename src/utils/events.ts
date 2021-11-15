import TypedEvent from './TypedEvent'

export const DocumentVisibleEvent = new TypedEvent()
export const DocumentHiddenEvent = new TypedEvent()

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') DocumentVisibleEvent.emit()
  if (document.visibilityState === 'hidden') DocumentHiddenEvent.emit()
})
