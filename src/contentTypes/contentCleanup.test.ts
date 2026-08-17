import { expect, test } from 'vitest'
import WS from 'vitest-websocket-mock'

import { sleep } from '@/utils'
import { socket } from '@/utils/Socket'
import IndexedMap from '@/utils/IndexedMap'
import contentCleanup from './contentCleanup'

declare namespace global {
  const WS: WS
}

type TestContent = { pk: number; a: number; b: number }

async function subscribe(channelType: string, pk: number) {
  const p = { channel_type: channelType, pk }
  const { leave, promise } = socket.channels.subscribe(channelType, pk)
  await sleep()
  const message: any = await global.WS.nextMessage
  expect(message).toEqual(
    expect.objectContaining({ t: 'channel.subscribe', p })
  )
  global.WS.send({ ...message, t: 'channel.subscribed', s: 's' })
  await promise
  return leave
}

test('contentCleanup', async () => {
  // Connect socket (usually handled by OnlineStatus)
  socket.connect()
  await global.WS.connected
  // Register for cleanup
  const testContent = new Map<number, TestContent>()
  contentCleanup.register(testContent, { a: 'a', b: 'b' })
  // An IndexedMap gets cleaned the same way — contentCleanup deletes straight
  // from the map, so this is what keeps its indexes honest.
  const indexed = new IndexedMap<TestContent, 'a'>({ a: (c) => c.a })
  contentCleanup.register(indexed, { a: 'a', b: 'b' })
  // Subscribe to channels
  const leaveA1 = await subscribe('a', 1)
  const leaveA2 = await subscribe('a', 2)
  const leaveB1 = await subscribe('b', 1)
  expect([...socket.channels.getSubscribedChannels()]).toEqual([
    { channelType: 'a', pk: 1 },
    { channelType: 'a', pk: 2 },
    { channelType: 'b', pk: 1 }
  ])
  // Set some content (usually from app_state)
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
  leaveA1(0)
  await sleep()
  expect(testContent.size).toEqual(2)
  expect(testContent.get(1)).toBe(undefined)
  // pk 1 is gone from the index too, pk 3 is still protected by b 1
  expect(indexed.by('a', 1).map((c) => c.pk)).toEqual([3])
  leaveA2(0)
  await sleep()
  expect(testContent.size).toEqual(1)
  expect(testContent.get(2)).toBe(undefined)
  expect(indexed.by('a', 2)).toEqual([])
  leaveB1(0)
  await sleep()
  expect(testContent.size).toEqual(0)
  // Index empties in step with the map, leaving no stale keys behind
  expect(indexed.size).toEqual(0)
  expect(indexed.indexes.a.size).toEqual(0)
})
