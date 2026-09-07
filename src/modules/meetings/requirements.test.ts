import { beforeAll, expect, test, vi } from 'vitest'
import { nextTick, shallowRef } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

// First, as in main.ts: ContentType, useContextRoles and the organisation
// content types form a cycle, and entering it anywhere else leaves ContentType
// half evaluated. See the "Import order important!" note in useAuthStore.
import '@/modules/auth/useAuthStore'

import { sleep } from '@/utils'
import { socket } from '@/socket'

declare namespace global {
  let WS: import('vitest-websocket-mock').default
}

// The user's moderator status, to be flipped mid-meeting the way a role change
// arriving over the socket would. Only ever read from inside the mocked
// `isModerator`, which is called long after this module has evaluated - so the
// hoisted vi.mock below closing over it is safe.
const moderator = shallowRef<boolean | undefined>(false)

vi.mock('./rules', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  isModerator: () => moderator.value
}))

/**
 * What the meeting fetch does, swapped per test. Same hoisting argument as
 * `moderator` above: the mock factory only runs when the module is imported,
 * long after this has been assigned.
 */
let fetchMeeting = async () => true

vi.mock('./useMeetingStore', () => ({
  default: () => ({
    fetchMeeting: () => fetchMeeting(),
    getMeeting: (pk: number) => ({ pk, title: 'Test meeting' })
  })
}))

import { ApiError } from '@/utils/restApi'

import { meetingFetchFailed, meetingRequirement } from './requirements'

const PK = 7

const route = {
  params: { id: String(PK) },
  path: `/m/${PK}/test-meeting`,
  query: {},
  hash: ''
} as unknown as RouteLocationNormalized

/** Channel actions the client has sent for our meeting, in order. */
async function sent() {
  await sleep(10)
  const messages = global.WS.messages as {
    action: string
    payload?: { channel_type?: string; pk?: number }
  }[]
  return messages
    .filter((m) => m.payload?.pk === PK)
    .map((m) => `${m.action} ${m.payload?.channel_type}`)
}

/** Settle a subscription the way the backend does. */
function completeSubscription(channelType: string) {
  for (const action of ['subscribed', 'state_complete'])
    global.WS.send({
      action: `channel.${action}`,
      payload: {
        channel_type: channelType,
        pk: PK,
        channel_name: `${channelType}_${PK}`,
        collectors: []
      }
    })
}

beforeAll(async () => {
  socket.connect()
  await global.WS.connected
})

test('a role change moves the meeting to the other channel', async () => {
  const requirement = meetingRequirement(route, route)
  if (Array.isArray(requirement) || !requirement)
    throw new Error('expected one requirement')

  const loading = requirement.load(() => {})
  await sleep(10)
  completeSubscription('participants')
  await loading
  expect(await sent()).toEqual(['channel.subscribe participants'])

  // Made a moderator while sitting in the meeting
  moderator.value = true
  await nextTick()
  await sleep(10)

  expect(await sent()).toEqual([
    'channel.subscribe participants',
    'channel.subscribe moderators'
  ])

  // The old channel is still held while the new one is being delivered. Giving
  // it back first would start its 500 ms leave timer here, and a delivery
  // slower than that - this one - would leave a window with neither channel
  // subscribed, in which contentCleanup finds the meeting's content
  // unprotected and drops it.
  await sleep(700)
  expect(await sent()).not.toContain('channel.leave participants')

  // Only once the new subscription is in does the old one go back
  completeSubscription('moderators')
  await sleep(600)
  expect(await sent()).toEqual([
    'channel.subscribe participants',
    'channel.subscribe moderators',
    'channel.leave participants'
  ])

  requirement.release?.()
  await sleep(600)
  expect(await sent()).toContain('channel.leave moderators')
})

test('an id that is not a pk asks for the 404 page', async () => {
  const bad = {
    params: { id: 'abc' },
    path: '/m/abc/def',
    query: {},
    hash: ''
  } as unknown as RouteLocationNormalized
  const requirement = meetingRequirement(bad, bad)
  if (Array.isArray(requirement) || !requirement)
    throw new Error('expected one requirement')

  // Nothing to fetch and no meeting to show: the guard is the only place left
  // that can still send the user somewhere.
  expect(requirement.blocking).toBe(true)
  expect(await requirement.load(() => {})).toMatchObject({
    name: '404',
    params: { pathMatch: ['m', 'abc', 'def'] }
  })
  // Holds nothing, so it is asked again on the next navigation rather than
  // being skipped as still in hand.
  expect(requirement.release).toBeUndefined()
})

test('a meeting the server says is not there asks for the 404 page', async () => {
  fetchMeeting = () => {
    throw new ApiError(404, {}, new Headers(), '404 Not Found')
  }
  const requirement = meetingRequirement(route, route)
  if (Array.isArray(requirement) || !requirement)
    throw new Error('expected one requirement')

  // A wrong address, not a door we might be let through - so the 404 page
  // rather than the permission dialog a refusal gets.
  expect(await requirement.load(() => {})).toMatchObject({
    name: '404',
    params: { pathMatch: ['m', String(PK), 'test-meeting'] }
  })
  expect(meetingFetchFailed.value).toBe(false)
})

test('a fetch that failed some other way is left to the view', async () => {
  fetchMeeting = () => {
    throw new ApiError(403, {}, new Headers(), '403 Forbidden')
  }
  const requirement = meetingRequirement(route, route)
  if (Array.isArray(requirement) || !requirement)
    throw new Error('expected one requirement')

  expect(await requirement.load(() => {})).toBeUndefined()
  expect(meetingFetchFailed.value).toBe(true)
})
