import { ValidationError } from '@/utils/Socket'
import { expect, test } from 'vitest'

import useErrorHandler from './useErrorHandler'

test('Bad error', () => {
  const { handleSocketError } = useErrorHandler()
  expect(() => handleSocketError('bad error')).toThrowError('bad error')
})

test('Error.message', () => {
  const { errorMessage, fieldErrors, clearErrors, handleSocketError } = useErrorHandler()
  handleSocketError(new Error('message'))
  expect(errorMessage.value).toBe('message')
  expect(fieldErrors.value).toEqual({})
  clearErrors()
  expect(errorMessage.value).toBe(null)
})

// TODO Make sure this is actual data structure from backend.
test('ValidationError.errors', () => {
  const { errorMessage, fieldErrors, clearErrors, handleSocketError } = useErrorHandler()
  handleSocketError(new ValidationError('message', [{
    loc: ['test'],
    msg: 'field message',
    type: 'error.testing'
  }]))
  expect(errorMessage.value).toBe('message')
  expect(fieldErrors.value).toEqual({ test: ['field message'] })
  clearErrors()
  expect(errorMessage.value).toBe(null)
  expect(fieldErrors.value).toEqual({})
})
