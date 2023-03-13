import moment from 'moment'
import { expect, test } from 'vitest'

import { dateify, dialogQuery, durationToString, sleep, slugify, stripHTML, tagify, uriToPayload } from '.'
import { openDialogEvent } from './events'

test('uriToPayload', () => {
  expect(uriToPayload('test/123')).toStrictEqual({ channel_type: 'test', pk: 123 })

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

test('dateify', () => {
  expect(dateify({ date: null }, 'date').date).toBe(null)
  expect(dateify({ date: '2012-12-12T12:12:12.000Z' }, 'date').date).toBeInstanceOf(Date)
  expect((dateify({ date: '2012-12-12T12:12:12.000Z' }, 'date').date as unknown as Date).getFullYear()).toBe(2012)
  expect(dateify({ date: '2012-12-12T12:12:12.000Z', null: null }, 'null').date).toBeTypeOf('string')
})

test('stripHTML', () => {
  expect(stripHTML('  <div>I\'m a <em>test pilot</em>.</div>  ')).toBe('I\'m a test pilot.')
})

test('dialogQuery', () => {
  openDialogEvent.once(({ resolve }) => { resolve(true) })
  expect(dialogQuery('Testing resolve')).resolves.toBe(true)

  openDialogEvent.once(() => { throw new Error('error') })
  expect(dialogQuery({ title: 'Testing reject' })).rejects.toBeInstanceOf(Error)
})

test('durationToString', () => {
  // Moment js should be deprecated
  expect(durationToString(moment.duration(299, 'minutes'))).toEqual('4:59:00')
  expect(durationToString(moment.duration(123, 'minutes'))).toEqual('2:03:00')
  expect(durationToString(moment.duration(59, 'minutes'))).toEqual('59:00')
  expect(durationToString(moment.duration(60, 'seconds'))).toEqual('1:00')
  expect(durationToString(moment.duration(59, 'seconds'))).toEqual('0:59')
  expect(durationToString(moment.duration(1, 'second'))).toEqual('0:01')
})

test('sleep', async () => {
  const start = performance.now()
  await sleep(1)
  const duration = performance.now() - start
  expect(duration).toBeGreaterThan(1)
  expect(duration).toBeLessThan(10) // This will never be very exact. As long as it's at least 1s and stops at some point, it's ok.
})
