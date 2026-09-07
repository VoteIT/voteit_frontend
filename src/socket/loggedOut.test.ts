import { afterEach, expect, test, vi } from 'vitest'
import { WS } from 'vitest-websocket-mock'

import { sleep } from '@/utils'

import Socket, { CustomSocketCode } from './Socket'

// Own server and socket, rather than the shared ones from the test setup:
// these tests close the connection, which the setup's socket can't come back
// from.
const URL = 'ws://localhost:4321/ws/'

afterEach(() => {
  WS.clean()
})

/** Connect a socket, have the server close it with `code`, report the handler. */
async function serverClosesWith(code?: number) {
  const server = new WS(URL)
  const socket = new Socket(URL)
  const handler = vi.fn()
  socket.onLoggedOut(handler)
  await server.connected
  server.close(
    code === undefined ? undefined : { code, reason: '', wasClean: true }
  )
  await sleep()
  // Guards the negative cases below: they only mean anything if the close
  // reached the socket at all.
  expect(socket.readyState).toBe(WebSocket.CLOSED)
  return handler
}

test('a logged out close tells the handlers, with the code', async () => {
  expect(
    await serverClosesWith(CustomSocketCode.LoggedOut)
  ).toHaveBeenCalledWith(CustomSocketCode.LoggedOut)
})

test('so does a logged out everywhere close', async () => {
  expect(
    await serverClosesWith(CustomSocketCode.LoggedOutEverywhere)
  ).toHaveBeenCalledWith(CustomSocketCode.LoggedOutEverywhere)
})

test('an ordinary close leaves the session alone', async () => {
  // What a dropped connection looks like: reconnecting is the right answer,
  // and the user is still signed in.
  expect(await serverClosesWith()).not.toHaveBeenCalled()
})

test('a close code we know nothing about leaves the session alone', async () => {
  expect(await serverClosesWith(4002)).not.toHaveBeenCalled()
})

test('a disposed handler is not called', async () => {
  const server = new WS(URL)
  const socket = new Socket(URL)
  const handler = vi.fn()
  socket.onLoggedOut(handler)()
  await server.connected
  server.close({ code: CustomSocketCode.LoggedOut, reason: '', wasClean: true })
  await sleep()
  expect(handler).not.toHaveBeenCalled()
})
