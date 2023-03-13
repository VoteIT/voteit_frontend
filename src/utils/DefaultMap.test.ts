import { expect, test, vi } from 'vitest'
import DefaultMap from './DefaultMap'

test('DefaultMap', () => {
  const getter = vi.fn((value: string) => Number(value))
  const map = new DefaultMap<string, number>(getter, 2)
  expect(map.get('123')).toEqual(123)
  expect(map.get('abc')).toEqual(NaN)
  expect(getter).toHaveBeenCalledTimes(2)

  // Get from cache
  map.get('123')
  expect(getter).toHaveBeenCalledTimes(2)

  // Throw 123 out of cache
  map.get('124')
  map.get('123')
  expect(getter).toHaveBeenCalledTimes(4)

  // Set custom value
  map.set('124', 42)
  expect(map.get('124')).toEqual(42)
  expect(getter).toHaveBeenCalledTimes(4)
})
