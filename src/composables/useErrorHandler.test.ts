import { ValidationError } from 'envelope-client/src/errors'
import { expect, test, vi } from 'vitest'

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
  const { handleSocketError, handleRestError } = useErrorHandler()
  expect(() => handleSocketError('bad error')).toThrowError('bad error')
  expect(() => handleRestError('bad error')).toThrowError('bad error')
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
    __root__: ['Unknown error']
  })
  clearErrors()
  expect(errorMessage.value).toBe(null)
  expect(fieldErrors.value).toEqual({})
})

function mockAxiosError(message: string) {
  const axiosError = new Error(message)
  return Object.assign(axiosError, {
    isAxiosError: true,
    response: { data: { test: [message] } }
  })
}

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
  handleRestError(mockAxiosError(teapot))
  expect(errorMessage.value).toBe(teapot)
  expect(fieldErrors.value).toEqual({ test: [teapot] })
  clearErrors()
  expect(errorMessage.value).toBe(null)
  expect(fieldErrors.value).toEqual({})
})
