import { openAlertEvent } from '@/utils/events'
import { Alert } from './types'

export default function useAlert() {
  function alert(options: Alert | string) {
    openAlertEvent.emit(options)
  }

  return {
    alert
  }
}
