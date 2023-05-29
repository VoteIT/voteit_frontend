import { sortBy } from 'lodash'
import { expect, test } from 'vitest'
import { getUserRandomSortValue, user } from './useAuthentication'

function shuffleOrder (obj: { pk: number }) {
  return getUserRandomSortValue(obj.pk)
}

test('getUserRandomSortValue', () => {
  const sortObjects = [1, 2, 3, 4, 5].map(pk => ({ pk }))
  user.value = { pk: 1 }
  expect(sortBy(sortObjects, shuffleOrder).map(o => o.pk)).toEqual([2, 1, 5, 3, 4])
  user.value = { pk: 2 }
  expect(sortBy(sortObjects, shuffleOrder).map(o => o.pk)).toEqual([1, 5, 2, 3, 4])
  user.value = { pk: 3 }
  expect(sortBy(sortObjects, shuffleOrder).map(o => o.pk)).toEqual([3, 2, 1, 5, 4])
  user.value = { pk: 123 }
  expect(sortBy(sortObjects, shuffleOrder).map(o => o.pk)).toEqual([2, 1, 3, 4, 5])
  user.value = { pk: 12345 }
  expect(sortBy(sortObjects, shuffleOrder).map(o => o.pk)).toEqual([3, 2, 1, 4, 5])
})
