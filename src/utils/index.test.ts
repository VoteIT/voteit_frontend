import { expect, test } from 'vitest'

import { dateify, stripHTML, tagify, uriToPayload } from '.'

test('uriToPayload', () => {
  expect(uriToPayload('test/123')).toStrictEqual({ channel_type: 'test', pk: 123 })

  expect(() => uriToPayload('test/abc')).toThrowError()
  expect(() => uriToPayload('test/')).toThrowError()
  expect(() => uriToPayload('/123')).toThrowError()
  expect(() => uriToPayload('')).toThrowError()
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
