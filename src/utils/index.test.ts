import { Duration } from 'luxon'
import { expect, test } from 'vitest'

import {
  arrayEquals,
  capFirst,
  countMatching,
  dialogQuery,
  durationToString,
  getFieldSorter,
  getFullName,
  orderBy,
  setEquals,
  sleep,
  slugify,
  stripHTML,
  tagify,
  uriToPayload
} from '.'
import { openDialogEvent } from './events'

test('uriToPayload', () => {
  expect(uriToPayload('test/123')).toStrictEqual({
    channel_type: 'test',
    pk: 123
  })

  expect(() => uriToPayload('test/abc')).toThrowError()
  expect(() => uriToPayload('test/')).toThrowError()
  expect(() => uriToPayload('/123')).toThrowError()
  expect(() => uriToPayload('')).toThrowError()
})

test('slugify', () => {
  expect(slugify(' ABC  123 ')).toEqual('abc-123')
  expect(slugify('1. Meeting opening')).toEqual('1-meeting-opening')
  expect(slugify('åäö ÅÄÖ')).toEqual('aao-aao')
  expect(slugify('!?~^---"\'Hello')).toEqual('hello')
  expect(slugify('👀👀')).toEqual('-')
})

test('tagify', () => {
  expect(tagify('ABC123')).toBe('abc123')
  expect(tagify('ABC123.!?')).toBe('abc123')
  expect(tagify('ABC123.!?def')).toBe('abc123-def')
  expect(tagify('ABC-123åäö')).toBe('abc-123åäö')
})

test('stripHTML', () => {
  expect(stripHTML("  <div>I'm a <em>test pilot</em>.</div>  ")).toBe(
    "I'm a test pilot."
  )
})

test('dialogQuery', async () => {
  openDialogEvent.once(({ resolve }) => {
    resolve(true)
  })
  await expect(dialogQuery('Testing resolve')).resolves.toBe(true)

  openDialogEvent.once(() => {
    throw new Error('error')
  })
  await expect(dialogQuery({ title: 'Testing reject' })).rejects.toBeInstanceOf(
    Error
  )
})

test('durationToString', () => {
  expect(
    durationToString(Duration.fromObject({ day: 1, seconds: 42 }))
  ).toEqual('24:00:42')
  expect(durationToString(Duration.fromObject({ minutes: 299 }))).toEqual(
    '4:59:00'
  )
  expect(durationToString(Duration.fromObject({ minutes: 123 }))).toEqual(
    '2:03:00'
  )
  expect(durationToString(Duration.fromObject({ minutes: 59 }))).toEqual(
    '59:00'
  )
  expect(durationToString(Duration.fromObject({ seconds: 60 }))).toEqual('1:00')
  expect(durationToString(Duration.fromObject({ seconds: 59 }))).toEqual('0:59')
  expect(durationToString(Duration.fromObject({ second: 1 }))).toEqual('0:01')
})

test('sleep', async () => {
  const start = performance.now()
  await sleep(100)
  const duration = performance.now() - start
  expect(duration).toBeGreaterThan(95) // 100 ms is not guaranteed, apparently.
  expect(duration).toBeLessThan(1000) // This will never be very exact. As long as it's at least 100 ms and stops at some point, it's ok.
})

test('getFullName', () => {
  expect(getFullName({ first_name: 'Jane', last_name: 'Austen' })).toEqual(
    'Jane Austen'
  )
  expect(getFullName({ first_name: 'Jane', last_name: '' })).toEqual('Jane')
  expect(getFullName({ first_name: '', last_name: 'Austen' })).toEqual('Austen')
  expect(getFullName({ first_name: '', last_name: '' })).toEqual('')
})

test('getFieldSorter', () => {
  const data = [{ t: 'AAA' }, { t: 'BBB' }, { t: 'abc' }]
  const sorter = getFieldSorter('t')
  expect(sorter(data[0])).toEqual('aaa')
  expect(orderBy(data, 't').map((o) => o.t)).toEqual(['AAA', 'BBB', 'abc'])
  expect(orderBy(data, sorter).map((o) => o.t)).toEqual(['AAA', 'abc', 'BBB'])
})

test('orderBy', () => {
  const data = [
    { pk: 1, n: 2, s: 'b' },
    { pk: 2, n: 1, s: 'a' },
    { pk: 3, n: 2, s: 'a' },
    { pk: 4, n: null, s: 'c' },
    { pk: 5, n: 1, s: 'b' }
  ]
  const pks = (items: typeof data) => items.map((o) => o.pk)
  // Stable, with missing values last ascending...
  expect(pks(orderBy(data, 'n'))).toEqual([2, 5, 1, 3, 4])
  // ...and first descending, ties still in original order
  expect(pks(orderBy(data, 'n', 'desc'))).toEqual([4, 1, 3, 2, 5])
  // Several keys, each with its own direction
  expect(pks(orderBy(data, ['n', 's'], ['desc', 'asc']))).toEqual([
    4, 3, 1, 2, 5
  ])
  // Function keys, and a missing direction defaults to ascending
  expect(pks(orderBy(data, [(o) => o.s, 'n'], ['desc']))).toEqual([
    4, 5, 1, 2, 3
  ])
  // Accepts any iterable, and leaves it untouched
  expect(pks(orderBy(new Set(data), 's'))).toEqual([2, 3, 1, 5, 4])
  expect(pks(data)).toEqual([1, 2, 3, 4, 5])
})

test('arrayEquals', () => {
  expect(arrayEquals([1, 2], [1, 2])).toBe(true)
  expect(arrayEquals([1, 2], [2, 1])).toBe(false)
  expect(arrayEquals([1, 2], [1, 2, 3])).toBe(false)
  expect(arrayEquals([], [])).toBe(true)
})

test('setEquals', () => {
  expect(setEquals(new Set([1, 2]), new Set([2, 1]))).toBe(true)
  expect(setEquals(new Set([1, 2]), new Set([1, 3]))).toBe(false)
  expect(setEquals(new Set([1]), new Set([1, 2]))).toBe(false)
})

test('countMatching', () => {
  expect(countMatching([1, 2, 3], (n) => n === 2)).toEqual(1)
  expect(countMatching([1, 2, 4], (n) => n % 2 === 0)).toEqual(2)
  expect(countMatching([1, 2, 4], (n) => n > 0)).toEqual(3)
})

test('capitalizeFirstLetter', () => {
  expect(capFirst('hello')).toBe('Hello')
  expect(capFirst('Hello')).toBe('Hello')
  expect(capFirst('')).toBe('')
  expect(capFirst('a')).toBe('A')
  expect(capFirst('abc def')).toBe('Abc def')
})
