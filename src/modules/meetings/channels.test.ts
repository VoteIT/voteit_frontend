import { beforeAll, expect, test, vi } from 'vitest'

// First, as in main.ts: ContentType, useContextRoles and the organisation
// content types form a cycle, and entering it anywhere else leaves ContentType
// half evaluated. See the "Import order important!" note in useAuthStore.
import '@/modules/auth/useAuthStore'

import { sleep } from '@/utils'
import { socket } from '@/socket'

import { onMeetingLeave } from './channels'
import { moderatorChannel, participantChannel } from './contentTypes'

declare namespace global {
  let WS: import('vitest-websocket-mock').default
}

type RoleChannel = typeof participantChannel

/** Subscribe, and settle the subscription the way the backend does. */
async function subscribe(channel: RoleChannel, pk: number) {
  const { promise } = channel.subscribe(pk)
  await sleep(10)
  for (const action of ['subscribed', 'state_complete'])
    global.WS.send({
      action: `channel.${action}`,
      payload: {
        channel_type: channel.name,
        pk,
        channel_name: `${channel.name}_${pk}`,
        collectors: []
      }
    })
  await promise
}

/** The server dropping us from a channel. */
async function serverLeave(channel: RoleChannel, pk: number) {
  global.WS.send({
    action: 'channel.left',
    payload: { channel_type: channel.name, pk }
  })
  await sleep(10)
}

beforeAll(async () => {
  socket.connect()
  await global.WS.connected
})

test('leaving the only role channel leaves the meeting', async () => {
  const fn = vi.fn()
  const dispose = onMeetingLeave(fn)
  await subscribe(participantChannel, 1)
  await serverLeave(participantChannel, 1)
  expect(fn).toHaveBeenCalledExactlyOnceWith(1)
  dispose()
})

test('a role swap is not a leave', async () => {
  const fn = vi.fn()
  const dispose = onMeetingLeave(fn)
  await subscribe(participantChannel, 2)
  // The swap takes the new channel before giving back the old one
  await subscribe(moderatorChannel, 2)
  await serverLeave(participantChannel, 2)
  expect(fn).not.toHaveBeenCalled()

  await serverLeave(moderatorChannel, 2)
  expect(fn).toHaveBeenCalledExactlyOnceWith(2)
  dispose()
})

test('a role channel for another meeting does not count', async () => {
  const fn = vi.fn()
  const dispose = onMeetingLeave(fn)
  await subscribe(participantChannel, 3)
  await subscribe(moderatorChannel, 4)
  await serverLeave(participantChannel, 3)
  expect(fn).toHaveBeenCalledExactlyOnceWith(3)
  await serverLeave(moderatorChannel, 4)
  dispose()
})
