import { openAlertEvent } from '@/utils'
import { Alert } from './types'

export default function useAlert () {
  function alert (options: Alert | string) {
    openAlertEvent.emit(options)
  }

  return {
    alert
  }
}
