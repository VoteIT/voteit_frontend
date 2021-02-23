import { emitter } from '@/utils'
import { Alert } from './types'

export default function useAlert () {
  function alert (options: Alert) {
    emitter.emit('alert-open', options)
  }

  return {
    alert
  }
}
