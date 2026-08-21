import { beforeAll, expect, test, vi } from 'vitest'
import WS from 'vitest-websocket-mock'

import { sleep } from '@/utils'

import { socket } from '.'
import defineChannel, { ErrorStatus, isSubscribeError } from './defineChannel'

declare namespace global {
  let WS: import('vitest-websocket-mock').default
}

const SOCKET_URL = 'ws://localhost:3000/ws/'

const channel = defineChannel('test', { leaveTimeout: 0 })

/**
 * Actions sent by the client for one channel id. Every test uses an id of its
 * own, so a stray message from another test can't be mistaken for one of ours.
 */
async function sentActions(pk: number) {
  // Give any pending send, and any leave timeout, a chance to run
  await sleep(10)
  const messages = global.WS.messages as {
    action: string
    payload?: { pk?: number }
  }[]
  return messages.filter((m) => m.payload?.pk === pk).map((m) => m.action)
}

/**
 * Fake a server message on the channel protocol.
 */
function serverSend(action: string, pk: number, extra: object = {}) {
  global.WS.send({
    action: `channel.${action}`,
    payload: { channel_type: 'test', pk, ...extra }
  })
}

/**
 * Settle a subscription the way the backend does: subscribed, state, complete.
 */
function completeSubscription(pk: number) {
  serverSend('subscribed', pk, { channel_name: `test_${pk}` })
  serverSend('state_complete', pk, { channel_name: `test_${pk}` })
}

/**
 * Subscribe and let the server accept it.
 */
async function subscribed(pk: number) {
  const subscription = channel.subscribe(pk)
  expect(await sentActions(pk)).toEqual(['channel.subscribe'])
  completeSubscription(pk)
  await subscription.promise
  return subscription
}

/**
 * Tell a pending promise from a settled one, without waiting for a timeout.
 */
function isPending(promise: Promise<unknown>) {
  // Nothing else handles a promise left pending, and it rejects on timeout
  promise.catch(() => {})
  const pending = Symbol('pending')
  return Promise.race([promise, Promise.resolve(pending)]).then(
    (value) => value === pending
  )
}

beforeAll(async () => {
  // Connecting is usually handled by OnlineStatus
  socket.connect()
  await global.WS.connected
})

test('subscription resolves on state_complete, not on subscribed', async () => {
  const { leave, promise } = channel.subscribe(1)
  expect(await sentActions(1)).toEqual(['channel.subscribe'])

  serverSend('subscribed', 1, { channel_name: 'test_1' })
  expect(await isPending(promise)).toBe(true)

  serverSend('state_complete', 1, { channel_name: 'test_1' })
  await expect(promise).resolves.toBeUndefined()
  leave()
})

test('onSubscribe fires on state_complete', async () => {
  const onSubscribe = vi.fn()
  const dispose = channel.onSubscribe(onSubscribe)
  const { leave } = await subscribed(2)

  expect(onSubscribe).toHaveBeenCalledOnce()
  expect(onSubscribe).toHaveBeenCalledWith({
    channel_name: 'test_2',
    channel_type: 'test',
    pk: 2
  })
  dispose()
  leave()
})

test('subscribe_error rejects with its detail', async () => {
  const { promise } = channel.subscribe(3)
  await sentActions(3)

  serverSend('subscribe_error', 3, { detail: 'Not allowed to subscribe' })
  const error = await promise.catch((e) => e)
  expect(isSubscribeError(error) && error.status).toBe(ErrorStatus.NotFound)
  expect(error.message).toBe('Not allowed to subscribe')
})

test('a second subscriber awaits an unfinished subscription', async () => {
  const first = channel.subscribe(4)
  await sentActions(4)
  serverSend('subscribed', 4, { channel_name: 'test_4' })

  // Joining between subscribed and state_complete: no data yet, so wait
  const second = channel.subscribe(4)
  expect(await isPending(second.promise)).toBe(true)

  serverSend('state_complete', 4, { channel_name: 'test_4' })
  await Promise.all([first.promise, second.promise])

  // A third subscriber has everything already, and nothing was ever re-sent
  const third = channel.subscribe(4)
  await expect(third.promise).resolves.toBeUndefined()
  expect(await sentActions(4)).toEqual(['channel.subscribe'])
  for (const { leave } of [first, second, third]) leave()
})

test('leave is sent once the last subscription is gone', async () => {
  const first = await subscribed(5)
  const second = channel.subscribe(5)
  await second.promise

  first.leave()
  // Still subscribed elsewhere, so nothing is sent
  expect(await sentActions(5)).toEqual(['channel.subscribe'])

  second.leave()
  expect(await sentActions(5)).toEqual(['channel.subscribe', 'channel.leave'])
})

test('an unsolicited left allows subscribing again', async () => {
  const onLeave = vi.fn()
  const dispose = channel.onLeave(onLeave)
  const first = await subscribed(6)

  // Access revoked - the server drops us without being asked
  serverSend('left', 6, { channel_name: 'test_6' })
  expect(onLeave).toHaveBeenCalledWith({
    channel_name: 'test_6',
    channel_type: 'test',
    pk: 6
  })

  const second = channel.subscribe(6)
  expect(await sentActions(6)).toEqual([
    'channel.subscribe',
    'channel.subscribe'
  ])
  expect(await isPending(second.promise)).toBe(true)
  dispose()
  first.leave()
  second.leave()
})

test('reconnect resubscribes live subscriptions', async () => {
  const onSubscribe = vi.fn()
  const dispose = channel.onSubscribe(onSubscribe)
  const subscription = await subscribed(7)

  // Restart the server under the client
  global.WS.close()
  await sleep(10)
  global.WS = new WS(SOCKET_URL, { jsonProtocol: true })
  socket.connect()
  await global.WS.connected

  expect(await sentActions(7)).toEqual(['channel.subscribe'])
  completeSubscription(7)
  await sleep()
  expect(onSubscribe).toHaveBeenCalledTimes(2)
  dispose()
  subscription.leave()
})
