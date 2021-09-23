import { activateBubbleEvent, closeBubbleEvent, openBubbleEvent, removeBubbleEvent } from './events'
import { BubbleComponent } from './types'

export default function useBubble (component: BubbleComponent) {
  function activate (data: object, config?: object) {
    config = config || {}
    activateBubbleEvent.emit({
      component,
      data,
      config
    })
  }

  function remove () {
    removeBubbleEvent.emit(component)
  }

  function open () {
    openBubbleEvent.emit(component)
  }

  function close () {
    closeBubbleEvent.emit(component)
  }

  return {
    activate,
    remove,
    open,
    close
  }
}
