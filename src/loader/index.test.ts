import { expect, test, vi } from 'vitest'

// The boot is somebody else's test. Here it is simply through, so the guard
// gets on with the route's own requirements.
const { reportLoadFailure } = vi.hoisted(() => ({
  reportLoadFailure: vi.fn()
}))
vi.mock('./appReady', async () => {
  const { shallowRef } = await import('vue')
  return {
    appReady: Promise.resolve(),
    bootDone: shallowRef(true),
    bootFailed: shallowRef(false),
    reportLoadFailure,
    startAppLoad: vi.fn()
  }
})

// Who is signed in is the gate's own test. Here it stands aside, so the guard
// gets on with the route's own requirements.
vi.mock('@/modules/auth/loginGate', () => ({ anonymousGate: () => undefined }))

import router from '@/router'

import useNavigationProgress from './index'

test('a first route that cannot be loaded is said so, not waited on', async () => {
  const { appLoaded, loadFailed } = useNavigationProgress()
  expect(loadFailed.value).toBe(false)

  router.addRoute({
    path: '/explodes',
    name: 'explodes',
    component: { template: '<div />' },
    meta: {
      load: () => ({
        key: 'explodes',
        blocking: true,
        async load() {
          throw new Error('the roof fell in')
        }
      })
    }
  })

  vi.spyOn(console, 'error').mockImplementation(() => {})
  await expect(router.push('/explodes')).rejects.toThrow('the roof fell in')

  // `router.isReady()` rejected, and rejected for good - nothing will ever set
  // `appLoaded` now. A splash waiting on that alone would stay up saying
  // "Loading" forever, so the failure has to be a state of its own.
  expect(appLoaded.value).toBe(false)
  expect(loadFailed.value).toBe(true)
  expect(reportLoadFailure).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'the roof fell in' })
  )
})
