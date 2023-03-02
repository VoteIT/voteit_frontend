import type { Dictionary } from 'lodash'
import { computed, ref } from 'vue'

import { openAlertEvent, openDialogEvent } from '@/utils/events'
import { isValidationError, parseSocketError } from '@/utils/Socket'

interface HandlerOptions {
  target: 'alert' | 'dialog' | 'none'
}

const DEFAULT_OPTIONS: HandlerOptions = {
  target: 'none'
} as const

export default function useErrorHandler (opts: HandlerOptions = DEFAULT_OPTIONS) {
  opts = { ...DEFAULT_OPTIONS, ...opts }

  const fieldErrors = ref<Dictionary<string[]>>({})
  const errorMessage = ref<string | null>(null)
  const hasError = computed(() => typeof errorMessage.value === 'string')

  function clearErrors () {
    fieldErrors.value = {}
    errorMessage.value = null
  }

  function displayError (message: string) {
    if (opts.target === 'dialog') openDialogEvent.emit({ title: message, resolve () {} })
    if (opts.target === 'alert') openAlertEvent.emit(`^${message}`)
  }

  function handleSocketError (e: unknown) {
    if (!(e instanceof Error)) throw e
    errorMessage.value = e.message
    fieldErrors.value = isValidationError(e)
      ? parseSocketError(e)
      : {}

    displayError(e.message)
  }

  return {
    errorMessage,
    fieldErrors,
    hasError,
    clearErrors,
    handleSocketError
  }
}
