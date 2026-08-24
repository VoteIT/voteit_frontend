import { beforeAll, expect, test, vi } from 'vitest'
import WS from 'vitest-websocket-mock'

import { sleep } from '@/utils'
import type { Progress } from '@/utils/types'

import { socket } from '.'
import defineChannel, {
  beforeChannelStateEvent,
  ErrorStatus,
  isSubscribeError
} from './defineChannel'

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
 * Fake a 'channel.subscribed', announcing the collectors whose output the
 * state bundles will carry.
 */
function serverSendSubscribed(
  pk: number,
  collectors: string[] = ['test.section']
) {
  serverSend('subscribed', pk, { channel_name: `test_${pk}`, collectors })
}

/**
 * Fake a 'channel.state' bundle: one section holding `messages`.
 */
function serverSendState(
  pk: number,
  messages: object[],
  section: { failed?: boolean; name?: string } = {}
) {
  serverSend('state', pk, {
    seq: 0,
    sections: [
      {
        complete: true,
        failed: false,
        messages,
        name: 'test.section',
        ...section
      }
    ]
  })
}

/**
 * Fake a 'channel.state' bundle of empty sections, one per named collector.
 */
function serverSendSections(
  pk: number,
  sections: { complete?: boolean; name: string }[]
) {
  serverSend('state', pk, {
    seq: 0,
    sections: sections.map(({ name, complete = true }) => ({
      complete,
      failed: false,
      messages: [],
      name
    }))
  })
}

/**
 * Settle a subscription the way the backend does: subscribed, state, complete.
 */
function completeSubscription(pk: number) {
  serverSendSubscribed(pk)
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

  serverSendSubscribed(1)
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
  // The payload here is the one from 'state_complete', which carries no
  // collectors - unlike the 'subscribed' frame that announced them
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
  serverSendSubscribed(4)

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
    collectors: ['test.section'],
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

test('bundled state is applied on state_complete, not as it arrives', async () => {
  const handler = vi.fn()
  const dispose = socket.registerTypeHandler('agenda_item', handler)
  const { promise } = channel.subscribe(8)
  await sentActions(8)
  serverSendSubscribed(8)

  serverSendState(8, [{ action: 'agenda_item.changed', payload: { pk: 11 } }])
  serverSendState(8, [
    { action: 'agenda_item.changed.batch', payload: { items: [{ pk: 12 }] } }
  ])
  await sleep(10)
  expect(handler).not.toHaveBeenCalled()

  serverSend('state_complete', 8, { channel_name: 'test_8' })
  await promise
  // Both bundles, in the order they arrived, with the batch unpacked
  expect(handler.mock.calls.map(([m]) => m)).toEqual([
    { action: 'changed', payload: { pk: 11 } },
    { action: 'changed', payload: { pk: 12 } }
  ])
  dispose()
  channel.subscribe(8).leave()
})

test('a failed section is delivered, with a warning', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const handler = vi.fn()
  const dispose = socket.registerTypeHandler('agenda_item', handler)
  const { promise } = channel.subscribe(9)
  await sentActions(9)
  serverSendSubscribed(9)

  serverSendState(9, [{ action: 'agenda_item.changed', payload: { pk: 13 } }], {
    failed: true
  })
  serverSend('state_complete', 9, { channel_name: 'test_9' })
  await promise

  expect(handler).toHaveBeenCalledOnce()
  expect(warn).toHaveBeenCalledOnce()
  warn.mockRestore()
  dispose()
  channel.subscribe(9).leave()
})

test('state left over from a dropped subscription is never applied', async () => {
  const handler = vi.fn()
  const dispose = socket.registerTypeHandler('agenda_item', handler)
  const { promise } = channel.subscribe(10)
  await sentActions(10)
  serverSendSubscribed(10)
  serverSendState(10, [{ action: 'agenda_item.changed', payload: { pk: 14 } }])

  // Thrown out before the state was complete
  serverSend('left', 10, { channel_name: 'test_10' })
  // A late bundle has nothing to complete it either
  serverSendState(10, [{ action: 'agenda_item.changed', payload: { pk: 15 } }])
  serverSend('state_complete', 10, { channel_name: 'test_10' })
  await sleep(10)

  expect(handler).not.toHaveBeenCalled()
  // And the late state_complete doesn't pass for a successful subscription
  expect(await isPending(promise)).toBe(true)
  dispose()
  channel.subscribe(10).leave()
})

test('cleanup and repopulation happen in the same tick', async () => {
  // The views must never render between the two: whatever a listener on
  // beforeChannelStateEvent clears has to be back before anything can paint.
  const order: string[] = []
  const cleanListener = beforeChannelStateEvent.on(({ pk }) => {
    if (pk === 11) order.push('cleanup')
  })
  const dispose = socket.registerTypeHandler('agenda_item', () => {
    order.push('content')
  })
  const { promise } = channel.subscribe(11)
  await sentActions(11)

  serverSendSubscribed(11)
  serverSendState(11, [{ action: 'agenda_item.changed', payload: { pk: 16 } }])
  // Nothing has been cleared yet - the old content is still on screen
  await sleep(10)
  expect(order).toEqual([])

  serverSend('state_complete', 11, { channel_name: 'test_11' })
  await promise
  expect(order).toEqual(['cleanup', 'content'])
  cleanListener.dispose()
  dispose()
  channel.subscribe(11).leave()
})

test('a repeated state_complete does not clear the channel', async () => {
  const cleanup = vi.fn()
  const listener = beforeChannelStateEvent.on(({ pk }) => {
    if (pk === 12) cleanup()
  })
  const { leave } = await subscribed(12)
  expect(cleanup).toHaveBeenCalledOnce()

  // A stray repeat has no state behind it, so clearing would be permanent
  serverSend('state_complete', 12, { channel_name: 'test_12' })
  await sleep(10)
  expect(cleanup).toHaveBeenCalledOnce()
  listener.dispose()
  leave()
})

test('progress counts the collectors that have completed', async () => {
  const { leave, promise } = channel.subscribe(13)
  const seen: Progress[] = []
  promise.onProgress((p) => seen.push(p))
  await sentActions(13)

  // The collectors announced up front are the total
  serverSendSubscribed(13, ['a', 'b', 'c'])
  await sleep(10)
  expect(promise.progress).toEqual({ curr: 0, total: 3 })

  // 'b' continues in the next bundle, so only 'a' counts here
  serverSendSections(13, [{ name: 'a' }, { complete: false, name: 'b' }])
  await sleep(10)
  expect(promise.progress).toEqual({ curr: 1, total: 3 })

  serverSendSections(13, [{ name: 'b' }, { name: 'c' }])
  await sleep(10)
  expect(promise.progress).toEqual({ curr: 3, total: 3 })

  serverSend('state_complete', 13, { channel_name: 'test_13' })
  await expect(promise).resolves.toBeUndefined()
  expect(seen).toEqual([
    { curr: 0, total: 3 },
    { curr: 1, total: 3 },
    { curr: 3, total: 3 }
  ])
  leave()
})

test('a section outside the announced collectors warns, and is not counted', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const { leave, promise } = channel.subscribe(14)
  await sentActions(14)

  serverSendSubscribed(14, ['a'])
  serverSendSections(14, [{ name: 'surprise' }])
  await sleep(10)

  expect(warn).toHaveBeenCalledOnce()
  expect(promise.progress).toEqual({ curr: 0, total: 1 })
  warn.mockRestore()
  leave()
})

test('a subscriber joining a delivery picks up its progress', async () => {
  const first = channel.subscribe(15)
  await sentActions(15)
  serverSendSubscribed(15, ['a', 'b'])
  serverSendSections(15, [{ name: 'a' }])
  await sleep(10)

  // Joining now, halfway through, starts halfway - not at nothing
  const second = channel.subscribe(15)
  await sleep(10)
  expect(second.promise.progress).toEqual({ curr: 1, total: 2 })

  serverSend('state_complete', 15, { channel_name: 'test_15' })
  await Promise.all([first.promise, second.promise])

  // And a subscriber arriving after it's all delivered has nothing to wait for
  const third = channel.subscribe(15)
  await third.promise
  expect(third.promise.progress).toEqual({ curr: 2, total: 2 })
  for (const { leave } of [first, second, third]) leave()
})
