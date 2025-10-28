import { expect, test, vi } from 'vitest'

import useLoader from './useLoader'
import { InitState } from './types'
import { sleep } from '@/utils'
import { readyToLoadEvent } from './events'

test('useLoader', async () => {
  const callback = vi.fn(() => Promise.resolve())
  const loader = useLoader('test', Promise.resolve())
  loader.call(callback)

  expect(loader.initState.value).toBe(undefined)
  expect(callback).not.toHaveBeenCalled()

  readyToLoadEvent.emit()
  await sleep() // nextTick
  expect(callback).toHaveBeenCalledOnce()
  expect(loader.initState.value).toBe(InitState.Done)
  expect(loader.initDone.value).toBe(true)
})
