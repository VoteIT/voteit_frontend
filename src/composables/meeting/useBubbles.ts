import { activateBubbleEvent, closeBubbleEvent, openBubbleEvent, removeBubbleEvent } from '@/components/meeting/bubbles/events'
import { BubbleComponent } from '@/components/meeting/bubbles/types'

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
