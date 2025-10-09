import { isEmpty, type Dictionary } from 'lodash'
import { computed, ref } from 'vue'
import { isValidationError, parseSocketError } from 'envelope-client'

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

function joinStrings(msgs: string[] | string) {
  if (typeof msgs === 'string') return msgs
  return msgs.join(', ')
}

function getNonspecificFieldErrorMessage(
  errors: Dictionary<string[] | string>
) {
  if (isEmpty(errors)) return
  return Object.entries(errors)
    .map(([field, msgs]) => `${field}: ${joinStrings(msgs)}`)
    .join('\n')
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

  function handleError(
    e: unknown,
    parse: (e: Error) => Dictionary<string[]>,
    showField?: string
  ) {
    if (!(e instanceof Error)) throw e
    errorMessage.value = e.message
    fieldErrors.value = parse(e)
    showField = showField ?? opts.showField
    displayError(
      showField
        ? getSpecifiedFieldErrorMessage(fieldErrors.value, showField)
        : getNonspecificFieldErrorMessage(fieldErrors.value) ?? e.message
    )
  }

  function handleSocketError(e: unknown, showField?: string) {
    handleError(e, parseSocketError, showField)
  }

  function handleRestError(e: unknown, showField?: string) {
    handleError(e, parseRestError, showField)
  }

  return {
    errorMessage,
    fieldErrors,
    hasError,
    clearErrors,
    handleError(e: unknown) {
      if (isValidationError(e)) handleSocketError(e)
      else handleRestError(e)
    },
    handleSocketError,
    handleRestError
  }
}
