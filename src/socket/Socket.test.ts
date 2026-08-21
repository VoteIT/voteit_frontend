import { beforeAll, expect, test, vi } from 'vitest'

import { sleep } from '@/utils'

import { socket } from '.'

declare namespace global {
  let WS: import('vitest-websocket-mock').default
}

/**
 * Register a handler for a type, send it a message and return what it got.
 */
async function received(type: string, message: object) {
  const handler = vi.fn()
  const dispose = socket.registerTypeHandler(type, handler)
  global.WS.send(message)
  await sleep()
  dispose()
  return handler.mock.calls.map(([data]) => data)
}

beforeAll(async () => {
  socket.connect()
  await global.WS.connected
})

test('a plain message keeps its action, type stripped', async () => {
  expect(
    await received('agenda_item', {
      action: 'agenda_item.changed',
      payload: { pk: 1 }
    })
  ).toEqual([{ action: 'changed', payload: { pk: 1 } }])
})

test('a batch is unpacked into one message per item', async () => {
  expect(
    await received('agenda_item', {
      action: 'agenda_item.changed.batch',
      payload: { items: [{ pk: 1 }, { pk: 2 }] }
    })
  ).toEqual([
    { action: 'changed', payload: { pk: 1 } },
    { action: 'changed', payload: { pk: 2 } }
  ])
})

test('an empty batch calls nobody', async () => {
  expect(
    await received('agenda_item', {
      action: 'agenda_item.changed.batch',
      payload: { items: [] }
    })
  ).toEqual([])
})

test('a batch of a dotted action keeps the rest of the action', async () => {
  expect(
    await received('s', {
      action: 's.some.nested.batch',
      payload: { items: [{ a: 1 }] }
    })
  ).toEqual([{ action: 'some.nested', payload: { a: 1 } }])
})

test('a malformed batch is reported, not passed on', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  expect(
    await received('agenda_item', {
      action: 'agenda_item.changed.batch',
      payload: { pk: 1 }
    })
  ).toEqual([])
  expect(error).toHaveBeenCalledOnce()
  error.mockRestore()
})
