import { ValidationError } from 'envelope-client/src/errors.js'
import { expect, test, vi } from 'vitest'

import { ApiError } from '@/utils/restApi'
import { openDialogEvent } from '@/utils/events'
import useErrorHandler from './useErrorHandler'
import { useI18n } from 'vue-i18n'

vi.mock('vue-i18n')

// @ts-ignore
useI18n.mockReturnValue({
  t(tKey: string) {
    return tKey
  }
})

test('Bad error', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const { errorMessage, fieldErrors, handleSocketError, handleRestError } =
    useErrorHandler()
  // Non-Errors are reported rather than rethrown, so callers can reset a
  // loading flag on the line after handling. They are logged as well, since
  // they mean a bug rather than a failed request.
  handleSocketError('bad error')
  expect(errorMessage.value).toBe('bad error')
  expect(fieldErrors.value).toEqual({ __root__: ['bad error'] })
  handleRestError('bad error')
  expect(errorMessage.value).toBe('bad error')
  expect(fieldErrors.value).toEqual({ non_field_errors: ['Unknown error'] })
  expect(consoleSpy).toHaveBeenCalledTimes(2)
  consoleSpy.mockRestore()
})

test('Error.message', () => {
  const {
    errorMessage,
    fieldErrors,
    clearErrors,
    handleSocketError,
    handleRestError
  } = useErrorHandler()
  handleSocketError(new Error('message'))
  expect(errorMessage.value).toBe('message')
  expect(fieldErrors.value).toEqual({ __root__: ['message'] })
  handleRestError(new Error('message'))
  expect(errorMessage.value).toBe('message')
  expect(fieldErrors.value).toEqual({
    non_field_errors: ['Unknown error']
  })
  clearErrors()
  expect(errorMessage.value).toBe(null)
  expect(fieldErrors.value).toEqual({})
})

function mockApiError(message: string) {
  return new ApiError(400, { test: [message] }, new Headers(), message)
}

test('handled', async () => {
  const { errorMessage, fieldErrors, handled } = useErrorHandler()
  expect(await handled(async () => 'ok')).toBe('ok')
  expect(errorMessage.value).toBe(null)

  const teapot = "I'm a teapot"
  expect(
    await handled(async () => {
      throw mockApiError(teapot)
    })
  ).toBe(undefined)
  expect(errorMessage.value).toBe(teapot)
  expect(fieldErrors.value).toEqual({ test: [teapot] })

  // Synchronous throws are caught too
  expect(
    await handled(() => {
      throw mockApiError(teapot)
    })
  ).toBe(undefined)

  // Never rejects, so `loading.value = false` on the next line always runs
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  expect(await handled(async () => Promise.reject('bad error'))).toBe(undefined)
  expect(errorMessage.value).toBe('bad error')
  expect(consoleSpy).toHaveBeenCalledWith('bad error')
  consoleSpy.mockRestore()
})

test('handler', async () => {
  const { errorMessage, fieldErrors, handler } = useErrorHandler()
  const teapot = "I'm a teapot"

  const ok = handler((a: number, b: number) => Promise.resolve(a + b))
  expect(await ok(1, 2)).toBe(3)
  expect(errorMessage.value).toBe(null)

  // Arguments are forwarded, and synchronous throws are caught
  const fails = handler((message: string) => {
    throw mockApiError(message)
  })
  expect(await fails(teapot)).toBe(undefined)
  expect(errorMessage.value).toBe(teapot)
  expect(fieldErrors.value).toEqual({ test: [teapot] })

  // Never rejects, so `loading.value = false` on the next line always runs
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  expect(await handler(() => Promise.reject('bad error'))()).toBe(undefined)
  expect(errorMessage.value).toBe('bad error')
  expect(consoleSpy).toHaveBeenCalledWith('bad error')
  consoleSpy.mockRestore()
})

test('API failures are reported but not logged as bugs', async () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const { handled } = useErrorHandler()
  await handled(async () => {
    throw mockApiError("I'm a teapot")
  })
  expect(consoleSpy).not.toHaveBeenCalled()
  consoleSpy.mockRestore()
})

test('showField falls back to the other field errors', async () => {
  const dialogSpy = vi.spyOn(openDialogEvent, 'emit')
  const { handled } = useErrorHandler({ target: 'dialog', showField: 'body' })

  // The requested field wins
  await handled(async () => {
    throw new ApiError(400, { body: ['Too short'] }, new Headers(), 'Bad')
  })
  expect(dialogSpy).toHaveBeenLastCalledWith(
    expect.objectContaining({ title: 'Too short' })
  )

  // Errors on other fields must not be hidden behind 'Unknown error'
  await handled(async () => {
    throw new ApiError(400, { tags: ['Too many'] }, new Headers(), 'Bad')
  })
  expect(dialogSpy).toHaveBeenLastCalledWith(
    expect.objectContaining({ title: 'tags: Too many' })
  )
  dialogSpy.mockRestore()
})

test('ValidationError.errors', () => {
  const {
    errorMessage,
    fieldErrors,
    clearErrors,
    handleSocketError,
    handleRestError
  } = useErrorHandler()
  handleSocketError(
    new ValidationError('message', [
      {
        loc: ['test'],
        msg: 'field message',
        type: 'error.testing'
      }
    ])
  )
  expect(errorMessage.value).toBe('message')
  expect(fieldErrors.value).toEqual({ test: ['field message'] })
  const teapot = "I'm a teapot"
  handleRestError(mockApiError(teapot))
  expect(errorMessage.value).toBe(teapot)
  expect(fieldErrors.value).toEqual({ test: [teapot] })
  clearErrors()
  expect(errorMessage.value).toBe(null)
  expect(fieldErrors.value).toEqual({})
})
