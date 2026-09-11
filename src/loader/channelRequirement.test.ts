import { expect, test, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'

import { sleep } from '@/utils'
import defineChannel, {
  ErrorStatus,
  isSubscribeError
} from '@/socket/defineChannel'
import { socket } from '@/socket'

declare namespace global {
  let WS: import('vitest-websocket-mock').default
}

import channelFromParam, {
  channelRequirement,
  paramPk
} from './channelRequirement'
import type { Requirement } from './types'

const channel = defineChannel('requirementTest', { leaveTimeout: 0 })

test('does not wait for a subscription there is no socket for', async () => {
  // The socket is closed here, as it is for an anonymous visitor, who never
  // gets one at all. Waiting would hold the splash for the whole subscribe
  // timeout before the login prompt they actually need turns up.
  expect(socket.isOpen).toBe(false)

  const requirement = channelRequirement(channel, 1)
  const settled = vi.fn()
  requirement.load(() => {}).then(settled)
  await sleep()

  expect(settled).toHaveBeenCalled()
  // Still subscribed, so the channel lands when the connection does
  requirement.release?.()
})

test('paramPk reads a pk out of a route param', () => {
  const route = (params: Record<string, unknown>) =>
    ({ params }) as unknown as Parameters<typeof paramPk>[0]
  expect(paramPk(route({ id: '12' }), 'id')).toBe(12)
  expect(paramPk(route({ id: 'x' }), 'id')).toBeUndefined()
  expect(paramPk(route({ id: '0' }), 'id')).toBeUndefined()
  expect(paramPk(route({}), 'id')).toBeUndefined()
  expect(paramPk(route({ id: ['12'] }), 'id')).toBeUndefined()
})

test('a param that is not a pk asks for the 404 page', () => {
  const route = (id: string) =>
    ({
      params: { id },
      path: `/room/${id}`,
      query: {},
      hash: ''
    }) as unknown as RouteLocationNormalized
  const factory = channelFromParam(channel, 'id')

  // Returning nothing here would say "this route has nothing to load", and the
  // view would mount empty with nothing to explain itself with.
  const missing = factory(route('abc'), route('abc'))
  expect(missing).toMatchObject({ blocking: true })

  const found = factory(route('12'), route('12'))
  expect(found).toMatchObject({ key: 'requirementTest/12' })
  ;(found as Requirement).release?.()
})

test('a subscription nobody answers fails the requirement', async () => {
  // A backend that's only half up: the socket is there, so we ask, and nothing
  // comes back. Swallowing that here would leave whoever asked for the channel
  // believing they had it - and a blocking requirement letting the navigation
  // through to a view with nothing to show and no way to fill itself.
  const channel = defineChannel('requirementTimeout', {
    leaveTimeout: 0,
    subscribeTimeout: 60
  })
  socket.connect()
  await global.WS.connected

  const requirement = channelRequirement(channel, 2)
  const error = await requirement.load(() => {}).catch((e) => e)
  expect(isSubscribeError(error) && error.status).toBe(ErrorStatus.Timeout)
  requirement.release?.()
})
