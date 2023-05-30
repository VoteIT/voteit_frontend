import { range } from 'itertools'
import { sortBy } from 'lodash'
import { expect, test } from 'vitest'

import DefaultMap from '@/utils/DefaultMap'
import { getUserRandomSortValue, user } from './useAuthentication'

function shuffleOrder (obj: { pk: number }) {
  return getUserRandomSortValue(obj.pk)
}

function getDistribution (objects: { pk: number }[], count: number) {
  const counter = new DefaultMap<number, number>(() => 0)
  for (const pk of range(1, count)) {
    user.value = { pk }
    const first = Number(sortBy(objects, shuffleOrder).map(o => o.pk).join(''))
    counter.set(first, counter.get(first) + 1)
  }
  return Object.fromEntries(counter.entries())
}

test('getUserRandomSortValue', () => {
  const sortObjects = [1, 2, 3, 4, 5].map(pk => ({ pk }))
  user.value = { pk: 1 }
  expect(sortBy(sortObjects, shuffleOrder).map(o => o.pk)).toEqual([1, 5, 3, 2, 4])
  user.value = { pk: 2 }
  expect(sortBy(sortObjects, shuffleOrder).map(o => o.pk)).toEqual([4, 1, 5, 2, 3])
  user.value = { pk: 3 }
  expect(sortBy(sortObjects, shuffleOrder).map(o => o.pk)).toEqual([4, 1, 2, 5, 3])
  user.value = { pk: 123 }
  expect(sortBy(sortObjects, shuffleOrder).map(o => o.pk)).toEqual([5, 3, 1, 2, 4])
  user.value = { pk: 12345 }
  expect(sortBy(sortObjects, shuffleOrder).map(o => o.pk)).toEqual([5, 1, 2, 4, 3])
  expect(getDistribution([...range(1, 4)].map(pk => ({ pk })), 10_000)).toEqual({
    123: 2108,
    132: 1465,
    213: 1562,
    231: 1947,
    312: 1481,
    321: 1436
  })
})
