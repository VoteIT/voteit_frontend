import { emitter } from '../../utils'

export default function useBubble (component) {
  function activate (data, config) {
    config = config || {}
    emitter.emit('bubble_activate', {
      component,
      data,
      config
    })
  }

  function remove () {
    emitter.emit('bubble_remove', component)
  }

  function open () {
    emitter.emit('bubble_open', component)
  }

  function close () {
    emitter.emit('bubble_close', component)
  }

  return {
    activate,
    remove,
    open,
    close
  }
}
