import { expect, test } from 'vitest'
import stringToHSL from './stringToHSL'

test('stringToHSL', () => {
  expect(stringToHSL('test-1')).toEqual('hsl(233, 40%, 80%)')
  expect(stringToHSL('test-2')).toEqual('hsl(202, 40%, 80%)')
  expect(stringToHSL('test-3')).toEqual('hsl(171, 40%, 80%)')
  expect(stringToHSL('test-4')).toEqual('hsl(140, 40%, 80%)')
  expect(stringToHSL('test-5')).toEqual('hsl(109, 40%, 80%)')
  expect(stringToHSL('test-6')).toEqual('hsl(78, 40%, 80%)')
  expect(stringToHSL('test-7')).toEqual('hsl(47, 40%, 80%)')
  expect(stringToHSL('test-8')).toEqual('hsl(16, 40%, 80%)')
  expect(stringToHSL('test-9')).toEqual('hsl(345, 40%, 80%)')
})
