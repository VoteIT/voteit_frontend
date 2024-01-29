import type { Dictionary } from 'lodash'
import { computed, ref } from 'vue'
import { parseSocketError } from 'envelope-client'

import { openAlertEvent, openDialogEvent } from '@/utils/events'
import { parseRestError } from '@/utils/restApi'
import { useI18n } from 'vue-i18n'
import { ThemeColor } from '@/utils/types'

interface HandlerOptions {
  target: 'alert' | 'dialog' | 'none'
  showField?: string
}

const DEFAULT_OPTIONS: HandlerOptions = {
  target: 'none'
} as const

function getSpecifiedFieldErrorMessage(
  errors: Dictionary<string[]>,
  field: string
) {
  const fieldErrors = errors[field] ||
    errors.non_field_errors || ['Unkown error']
  return fieldErrors.join(', ')
}

export default function useErrorHandler(
  opts: HandlerOptions = DEFAULT_OPTIONS
) {
  const { t } = useI18n()
  opts = { ...DEFAULT_OPTIONS, ...opts }

  const fieldErrors = ref<Dictionary<string[]>>({})
  const errorMessage = ref<string | null>(null)
  const hasError = computed(() => typeof errorMessage.value === 'string')

  function clearErrors() {
    fieldErrors.value = {}
    errorMessage.value = null
  }

  function displayError(message: string) {
    if (opts.target === 'dialog')
      openDialogEvent.emit({
        title: message,
        resolve() {},
        no: false,
        yes: t('ok'),
        theme: ThemeColor.Warning
      })
    if (opts.target === 'alert') openAlertEvent.emit(`^${message}`)
  }

  function handleError(e: unknown, parse: (e: Error) => Dictionary<string[]>) {
    if (!(e instanceof Error)) throw e
    errorMessage.value = e.message
    fieldErrors.value = parse(e)
    displayError(
      opts.showField
        ? getSpecifiedFieldErrorMessage(fieldErrors.value, opts.showField)
        : e.message
    )
  }

  function handleSocketError(e: unknown) {
    handleError(e, parseSocketError)
  }

  function handleRestError(e: unknown) {
    handleError(e, parseRestError)
  }

  return {
    errorMessage,
    fieldErrors,
    hasError,
    clearErrors,
    handleSocketError,
    handleRestError
  }
}
