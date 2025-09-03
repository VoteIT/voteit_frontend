import { range } from 'itertools'
import { sortBy } from 'lodash'
import { expect, test } from 'vitest'

import DefaultMap from '@/utils/DefaultMap'
import { getUserRandomSortValue, user } from './useAuthentication'

function shuffleOrder(obj: { pk: number }) {
  return getUserRandomSortValue(obj.pk)
}

function getDistribution(objects: { pk: number }[], count: number) {
  const counter = new DefaultMap<number, number>(() => 0)
  for (const pk of range(1, count)) {
    // @ts-ignore
    user.value = { pk }
    const first = Number(
      sortBy(objects, shuffleOrder)
        .map((o) => o.pk)
        .join('')
    )
    counter.set(first, counter.get(first) + 1)
  }
  return Object.fromEntries(counter.entries())
}

test('getUserRandomSortValue', () => {
  const sortObjects = [1, 2, 3, 4, 5].map((pk) => ({ pk }))
  // @ts-ignore
  user.value = { pk: 1 }
  expect(sortBy(sortObjects, shuffleOrder).map((o) => o.pk)).toEqual([
    4, 2, 5, 1, 3
  ])
  // @ts-ignore
  user.value = { pk: 2 }
  expect(sortBy(sortObjects, shuffleOrder).map((o) => o.pk)).toEqual([
    1, 5, 3, 2, 4
  ])
  // @ts-ignore
  user.value = { pk: 3 }
  expect(sortBy(sortObjects, shuffleOrder).map((o) => o.pk)).toEqual([
    5, 1, 3, 4, 2
  ])
  // @ts-ignore
  user.value = { pk: 123 }
  expect(sortBy(sortObjects, shuffleOrder).map((o) => o.pk)).toEqual([
    4, 3, 1, 2, 5
  ])
  // @ts-ignore
  user.value = { pk: 12345 }
  expect(sortBy(sortObjects, shuffleOrder).map((o) => o.pk)).toEqual([
    1, 4, 3, 2, 5
  ])
  expect(
    getDistribution(
      [...range(1, 4)].map((pk) => ({ pk })),
      10_000
    )
  ).toEqual({
    123: 1694,
    132: 1642,
    213: 1646,
    231: 1671,
    312: 1630,
    321: 1716
  })
})
