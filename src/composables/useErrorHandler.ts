import { isEmpty } from 'lodash'
import { computed, ref } from 'vue'

import { openAlertEvent, openDialogEvent } from '@/utils/events'
import { isApiError, NetworkError, parseRestError } from '@/utils/restApi'
import { useI18n } from 'vue-i18n'
import { ThemeColor } from '@/utils/types'

type APIError = { [P in string]?: string[] }

interface HandlerOptions {
  target: 'alert' | 'dialog' | 'none'
  showField?: string
}

const DEFAULT_OPTIONS: HandlerOptions = {
  target: 'none'
} as const

function getSpecifiedFieldErrorMessage(errors: APIError, field: string) {
  const fieldErrors = errors[field] || errors.non_field_errors
  if (fieldErrors) return fieldErrors.join(', ')
  // Nothing on the requested field: report whatever the server did complain
  // about, rather than hiding it behind a generic message.
  return getNonspecificFieldErrorMessage(errors) ?? 'Unknown error'
}

function joinStrings(msgs: string[] | string) {
  if (typeof msgs === 'string') return msgs
  return msgs.join(', ')
}

/** True for errors that mean a request failed, as opposed to a bug. */
function isRequestFailure(e: unknown) {
  return isApiError(e) || e instanceof NetworkError
}

function getNonspecificFieldErrorMessage(errors: APIError) {
  if (isEmpty(errors)) return
  return Object.entries(errors)
    .map(([field, msgs]) => msgs && `${field}: ${joinStrings(msgs)}`)
    .join('\n')
}

/**
 * Centralised error handling for REST API calls.
 * Parses validation errors into per-field messages and optionally
 * surfaces them via an alert snackbar or a modal dialog.
 *
 * @param opts.target - Where to show errors: `'alert'` (snackbar), `'dialog'` (modal), or `'none'` (silent)
 * @param opts.showField - If set, only the error for this field (or `non_field_errors`) is displayed
 * @returns `{ errorMessage, fieldErrors, hasError, clearErrors, handled, handler, handleRestError }`
 */
export default function useErrorHandler(
  opts: HandlerOptions = DEFAULT_OPTIONS
) {
  const { t } = useI18n()
  opts = { ...DEFAULT_OPTIONS, ...opts }

  const fieldErrors = ref<APIError>({})
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

  function handleRestError(e: unknown, showField?: string) {
    // Never rethrow: callers reset their loading flags on the line after
    // `handled`, so throwing here would strand them. Anything that isn't a
    // failed request is a bug, so log it rather than only showing the
    // generic message it parses down to.
    if (!isRequestFailure(e)) console.error(e)
    const error = e instanceof Error ? e : new Error(String(e))
    errorMessage.value = error.message
    fieldErrors.value = parseRestError(error)
    showField = showField ?? opts.showField
    displayError(
      showField
        ? getSpecifiedFieldErrorMessage(fieldErrors.value, showField)
        : (getNonspecificFieldErrorMessage(fieldErrors.value) ?? error.message)
    )
  }

  /**
   * Runs an action, reporting any REST error to the user.
   * Resolves to the action's value, or `undefined` if it failed.
   *
   * Never rejects, so a loading flag can safely be reset on the next line
   * rather than in a `finally` block.
   *
   * @param showField - Overrides `opts.showField` for this action
   */
  async function handled<T>(
    action: () => Promise<T> | T,
    showField?: string
  ): Promise<Awaited<T> | undefined> {
    try {
      return await action()
    } catch (e) {
      handleRestError(e, showField)
    }
  }

  /**
   * Wraps an action, returning a function that reports any REST error to the
   * user. Use for reusable handlers; use `handled` for a one-off action.
   *
   * The wrapper forwards its arguments to the action, so avoid binding it
   * straight to a template event (`@click="handle.start"`) unless the action
   * should receive the event object.
   *
   * @param showField - Overrides `opts.showField` for this action
   */
  function handler<A extends unknown[], T>(
    action: (...args: A) => Promise<T> | T,
    showField?: string
  ) {
    return (...args: A) => handled(() => action(...args), showField)
  }

  return {
    errorMessage,
    fieldErrors,
    hasError,
    clearErrors,
    handled,
    handler,
    handleRestError
  }
}
