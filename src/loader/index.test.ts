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

import { sleep } from '@/utils'
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

test('a redirect back to where we came from settles the navigation', async () => {
  // Being refused a meeting sends the user home - the page they clicked it
  // from, and so the route they are already on. vue-router answers that with a
  // duplicated navigation under the *home* path and never reports the meeting
  // navigation at all, so a loader waiting to hear about the route it was
  // loading waits forever, and the progress bar sits there over a navigation
  // that is long over.
  const { pendingRoute } = useNavigationProgress()
  const component = { template: '<div />' }
  router.addRoute({ path: '/start', name: 'start', component })
  router.addRoute({
    path: '/refused',
    name: 'refused',
    component,
    meta: {
      load: () => ({
        key: 'refused',
        blocking: true,
        async load() {
          return { name: 'start' }
        }
      })
    }
  })

  await router.push('/start')
  await router.push('/refused').catch(() => {})
  await sleep()

  expect(router.currentRoute.value.name).toBe('start')
  expect(pendingRoute.value).toBeUndefined()
})
