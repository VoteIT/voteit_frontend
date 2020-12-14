import { emitter } from '@/utils'

export default function useAlert () {
  function alert (options) {
    emitter.emit('alert-open', options)
  }

  return {
    alert
  }
}
