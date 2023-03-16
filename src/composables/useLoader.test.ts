import { expect, test, vi } from 'vitest'
import { nextTick } from 'vue'

import { socketState } from '@/utils/Socket'
import useAuthentication from './useAuthentication'
import useLoader from './useLoader'
import { InitState } from './types'
import { sleep } from '@/utils'

const { isAuthenticated } = useAuthentication()

test('useLoader', async () => {
  const callback = vi.fn(() => Promise.resolve())
  const loader = useLoader('test', Promise.resolve())
  loader.call(callback)

  expect(loader.initState.value).toBe(InitState.Loading)
  expect(callback).not.toHaveBeenCalled()

  socketState.value = true
  isAuthenticated.value = true
  await sleep(10) // Wait for loading to happen
  expect(callback).toHaveBeenCalledOnce()
  expect(loader.initState.value).toBe(InitState.Done)
  expect(loader.initDone.value).toBe(true)
})
