import { beforeAll, expect, test } from 'vitest'
import WS from 'vitest-websocket-mock'

import { sleep } from '@/utils'
import { socket } from '@/socket'
import defineChannel, { getSubscribedChannels } from '@/socket/defineChannel'
import IndexedMap from '@/utils/IndexedMap'
import contentCleanup from './contentCleanup'

declare namespace global {
  const WS: WS
}

type TestContent = { pk: number; a: number; b: number }

// Leaving is what triggers cleanup, so don't sit around waiting for it
const channelA = defineChannel('a', { leaveTimeout: 0 })
const channelB = defineChannel('b', { leaveTimeout: 0 })

async function subscribe(channel: typeof channelA, pk: number) {
  const { leave, promise } = channel.subscribe(pk)
  await sleep()
  const payload = { channel_type: channel.name, pk }
  expect(await global.WS.nextMessage).toEqual({
    action: 'channel.subscribe',
    payload
  })
  for (const action of ['subscribed', 'state_complete'])
    global.WS.send({ action: `channel.${action}`, payload })
  await promise
  return leave
}

beforeAll(async () => {
  // Connect socket (usually handled by OnlineStatus)
  socket.connect()
  await global.WS.connected
})

test('contentCleanup', async () => {
  // Register for cleanup
  const testContent = new Map<number, TestContent>()
  contentCleanup.register(testContent, { a: 'a', b: 'b' })
  // An IndexedMap gets cleaned the same way — contentCleanup deletes straight
  // from the map, so this is what keeps its indexes honest.
  const indexed = new IndexedMap<TestContent, 'a'>({ a: (c) => c.a })
  contentCleanup.register(indexed, { a: 'a', b: 'b' })
  // Subscribe to channels
  const leaveA1 = await subscribe(channelA, 1)
  const leaveA2 = await subscribe(channelA, 2)
  const leaveB1 = await subscribe(channelB, 1)
  expect(
    [...getSubscribedChannels()].map(({ channel_type, pk }) => [
      channel_type,
      pk
    ])
  ).toEqual([
    ['a', 1],
    ['a', 2],
    ['b', 1]
  ])
  // Set some content (usually from the channel's initial state)
  const content: TestContent[] = [
    { a: 1, b: 2, pk: 1 }, // Protected by a 1
    { a: 2, b: 2, pk: 2 }, // Protected by a 2
    { a: 1, b: 1, pk: 3 } // Protected by a and b
  ]
  for (const obj of content) {
    testContent.set(obj.pk, obj)
    indexed.set(obj.pk, obj)
  }
  expect(testContent.size).toEqual(3)
  expect(indexed.by('a', 1).map((c) => c.pk)).toEqual([1, 3])
  expect(indexed.by('a', 2).map((c) => c.pk)).toEqual([2])
  // Leave channels one by one
  leaveA1()
  await sleep()
  expect(testContent.size).toEqual(2)
  expect(testContent.get(1)).toBe(undefined)
  // pk 1 is gone from the index too, pk 3 is still protected by b 1
  expect(indexed.by('a', 1).map((c) => c.pk)).toEqual([3])
  leaveA2()
  await sleep()
  expect(testContent.size).toEqual(1)
  expect(testContent.get(2)).toBe(undefined)
  expect(indexed.by('a', 2)).toEqual([])
  leaveB1()
  await sleep()
  expect(testContent.size).toEqual(0)
  // Index empties in step with the map, leaving no stale keys behind
  expect(indexed.size).toEqual(0)
  expect(indexed.indexes.a.size).toEqual(0)
})

test('a resubscribe clears what the previous subscription delivered', async () => {
  const content = new Map<number, TestContent>()
  contentCleanup.register(content, { a: 'a', b: 'b' })
  const { leave, promise } = channelA.subscribe(10)
  await sleep()
  const payload = { channel_type: 'a', pk: 10 }
  global.WS.send({ action: 'channel.subscribed', payload })
  global.WS.send({ action: 'channel.state_complete', payload })
  await promise
  // Arrived with the channel's first state
  content.set(1, { pk: 1, a: 10, b: 0 })
  content.set(2, { pk: 2, a: 10, b: 0 })

  // Reconnecting starts the channel over. Anything deleted server side while
  // we were away is simply absent from the state that follows, so the channel
  // must not count as protecting what it delivered last time.
  global.WS.send({ action: 'channel.subscribed', payload })
  await sleep()
  // Not yet, though - clearing here would leave the views empty until the new
  // state turns up in a later frame. The swap waits for state_complete.
  expect(content.size).toEqual(2)

  global.WS.send({ action: 'channel.state_complete', payload })
  await sleep()
  expect(content.size).toEqual(0)
  leave()
})
