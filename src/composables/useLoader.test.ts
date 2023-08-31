import { expect, test, vi } from 'vitest'

import useAuthentication from './useAuthentication'
import useLoader from './useLoader'
import { InitState } from './types'
import { socket } from '@/utils/Socket'
import { sleep } from '@/utils'

const { isAuthenticated } = useAuthentication()

test('useLoader', async () => {
  const callback = vi.fn(() => Promise.resolve())
  const loader = useLoader('test', Promise.resolve())
  loader.call(callback)

  expect(loader.initState.value).toBe(InitState.Loading)
  expect(callback).not.toHaveBeenCalled()

  // Socket connects manually. In normal context it's handled by OnlineStatus component.
  socket.connect()
  // @ts-ignore
  await global.WS.connected // Websocket connect, see vitest.config.ts
  isAuthenticated.value = true
  await sleep() // nextTick
  expect(callback).toHaveBeenCalledOnce()
  expect(loader.initState.value).toBe(InitState.Done)
  expect(loader.initDone.value).toBe(true)
})
