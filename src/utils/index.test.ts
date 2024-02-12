import { Duration } from 'luxon'
import { expect, test } from 'vitest'

import {
  dialogQuery,
  durationToString,
  getFullName,
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

test('dialogQuery', () => {
  openDialogEvent.once(({ resolve }) => {
    resolve(true)
  })
  expect(dialogQuery('Testing resolve')).resolves.toBe(true)

  openDialogEvent.once(() => {
    throw new Error('error')
  })
  expect(dialogQuery({ title: 'Testing reject' })).rejects.toBeInstanceOf(Error)
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
