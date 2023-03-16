import { expect, test } from 'vitest'
import { isValidationErrorPayload } from './types'

test('isValidationErrorPayload', () => {
  expect(isValidationErrorPayload({ msg: 'test' })).toEqual(false)
  expect(isValidationErrorPayload({ msg: 'test', errors: [] })).toEqual(true)
})
