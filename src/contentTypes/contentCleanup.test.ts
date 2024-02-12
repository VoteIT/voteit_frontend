import { expect, test } from 'vitest'
import contentCleanup from './contentCleanup'
import { sleep } from '@/utils'
import { socket } from '@/utils/Socket'
import WS from 'vitest-websocket-mock'

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
  testContent.set(1, { a: 1, b: 2, pk: 1 }) // Protected by a 1
  testContent.set(2, { a: 2, b: 2, pk: 2 }) // Protected by a 2
  testContent.set(3, { a: 1, b: 1, pk: 3 }) // Protected by a and b
  expect(testContent.size).toEqual(3)
  // Leave channels one by one
  leaveA1(0)
  await sleep()
  expect(testContent.size).toEqual(2)
  expect(testContent.get(1)).toBe(undefined)
  leaveA2(0)
  await sleep()
  expect(testContent.size).toEqual(1)
  expect(testContent.get(2)).toBe(undefined)
  leaveB1(0)
  await sleep()
  expect(testContent.size).toEqual(0)
})
