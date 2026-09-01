import { beforeEach, expect, test, vi } from 'vitest'
import { START_LOCATION } from 'vue-router'
import type { RouteLocationNormalized, RouteRecordNormalized } from 'vue-router'

import { sleep } from '@/utils'

import {
  abortNavigation,
  progress,
  reset,
  settleNavigation,
  startNavigation,
  steps,
  trackBoot
} from './registry'
import type { Requirement, RequirementFactory } from './types'

function record(...load: RequirementFactory[]) {
  return { meta: load.length ? { load } : {} } as RouteRecordNormalized
}

let paths = 0
function route(...matched: RouteRecordNormalized[]) {
  return {
    matched,
    params: {},
    fullPath: `/route-${++paths}`
  } as unknown as RouteLocationNormalized
}

const FROM = route()

/** What the guards do once a navigation has landed on `to`. */
function landed(to: RouteLocationNormalized) {
  settleNavigation(to, FROM)
}

/**
 * A requirement whose load can be settled from the test, standing in for a
 * channel delivering its initial state. Blocking unless told otherwise, since
 * that's the case most of these are about.
 */
function deferred(
  key: string,
  opts: { held?: boolean; blocking?: boolean } = {}
) {
  let settle: (result?: unknown) => void = () => {}
  let fail: (reason?: unknown) => void = () => {}
  const report = vi.fn()
  const release = vi.fn()
  const started = vi.fn()
  const requirement: Requirement = {
    key,
    blocking: opts.blocking ?? true,
    load(setProgress) {
      started()
      report.mockImplementation(setProgress)
      return new Promise((resolve, reject) => {
        settle = resolve as typeof settle
        fail = reject
      })
    }
  }
  if (opts.held !== false) requirement.release = release
  return {
    requirement,
    factory: (() => requirement) as RequirementFactory,
    started,
    release,
    /** Report progress the way the requirement's own load would */
    progress: (curr: number, total: number) => report({ curr, total }),
    resolve: (result?: unknown) => settle(result),
    reject: (reason?: unknown) => fail(reason)
  }
}

beforeEach(() => {
  reset()
})

test('runs a record in parallel and records in sequence', async () => {
  const a = deferred('a')
  const b = deferred('b')
  const child = deferred('child')
  const navigation = startNavigation(
    route(record(a.factory, b.factory), record(child.factory)),
    FROM
  )
  await sleep()

  // Same record, so both are under way at once
  expect(a.started).toHaveBeenCalled()
  expect(b.started).toHaveBeenCalled()
  // The child waits for its parent - no point subscribing to an agenda item
  // before we know the meeting is ours
  expect(child.started).not.toHaveBeenCalled()
  expect(steps.value).toEqual({ done: 0, total: 3 })

  a.resolve()
  await sleep()
  expect(child.started).not.toHaveBeenCalled()
  expect(steps.value).toEqual({ done: 1, total: 3 })

  b.resolve()
  await sleep()
  expect(child.started).toHaveBeenCalled()

  child.resolve()
  await expect(navigation).resolves.toBeUndefined()
  expect(steps.value).toEqual({ done: 3, total: 3 })
})

test('asks for each key once', async () => {
  const one = deferred('same')
  const two = deferred('same')
  const navigation = startNavigation(
    route(record(one.factory), record(two.factory)),
    FROM
  )
  await sleep()

  expect(steps.value.total).toBe(1)
  expect(one.started).toHaveBeenCalled()
  expect(two.started).not.toHaveBeenCalled()

  one.resolve()
  await navigation
})

test('keeps what it holds across a navigation that still needs it', async () => {
  const meeting = deferred('meeting/1')
  const item = deferred('agenda/5')

  const meetingRoute = route(record(meeting.factory))
  const first = startNavigation(meetingRoute, FROM)
  await sleep()
  meeting.resolve()
  await first
  landed(meetingRoute)
  expect(meeting.started).toHaveBeenCalledTimes(1)

  // Same meeting, different agenda item: the meeting is already in hand
  const itemRoute = route(record(meeting.factory), record(item.factory))
  const second = startNavigation(itemRoute, FROM)
  await sleep()
  expect(meeting.started).toHaveBeenCalledTimes(1)
  expect(steps.value.total).toBe(1)
  item.resolve()
  await second
  landed(itemRoute)
  expect(meeting.release).not.toHaveBeenCalled()

  // Leaving the meeting altogether lets both go
  const elsewhere = route(record())
  await startNavigation(elsewhere, FROM)
  landed(elsewhere)
  expect(meeting.release).toHaveBeenCalledTimes(1)
  expect(item.release).toHaveBeenCalledTimes(1)
})

test('a requirement holding nothing runs every time', async () => {
  const list = deferred('meeting-list', { held: false })

  const home = route(record(list.factory))
  const navigation = startNavigation(home, FROM)
  await sleep()
  list.resolve()
  await navigation
  landed(home)
  expect(list.started).toHaveBeenCalledTimes(1)

  const again = startNavigation(route(record(list.factory)), FROM)
  await sleep()
  expect(list.started).toHaveBeenCalledTimes(2)
  list.resolve()
  await again
})

test('a redirect stops the records that would have followed', async () => {
  const gate = deferred('gate')
  const child = deferred('child')
  const navigation = startNavigation(
    route(record(gate.factory), record(child.factory)),
    FROM
  )
  await sleep()

  gate.resolve({ name: 'meeting:join' })
  await expect(navigation).resolves.toEqual({ name: 'meeting:join' })
  expect(child.started).not.toHaveBeenCalled()
})

test('a failing requirement fails the navigation', async () => {
  const failing = deferred('failing')
  const navigation = startNavigation(route(record(failing.factory)), FROM)
  await sleep()

  failing.reject(new Error('nope'))
  await expect(navigation).rejects.toThrow('nope')

  // It was registered before it failed, so it's still ours to give back
  abortNavigation()
  expect(failing.release).toHaveBeenCalled()
})

test('a superseded navigation neither redirects nor reports', async () => {
  const abandoned = deferred('abandoned')
  const current = deferred('current')

  const first = startNavigation(route(record(abandoned.factory)), FROM)
  await sleep()
  const currentRoute = route(record(current.factory))
  const second = startNavigation(currentRoute, FROM)
  await sleep()

  abandoned.progress(1, 1)
  abandoned.resolve({ name: 'home' })
  await expect(first).resolves.toBeUndefined()
  // Only the navigation that's actually running is on the bar
  expect(steps.value).toEqual({ done: 0, total: 1 })

  current.resolve()
  await second
  landed(currentRoute)
  // What the abandoned one took is given back, since we didn't end up needing it
  expect(abandoned.release).toHaveBeenCalled()
  expect(current.release).not.toHaveBeenCalled()
})

test('progress is normalised per requirement and never goes backwards', async () => {
  const quick = deferred('quick')
  const channel = deferred('channel')
  const navigation = startNavigation(
    route(record(quick.factory, channel.factory)),
    FROM
  )
  await sleep()
  expect(progress.value).toEqual({ curr: 0, total: 2 })

  quick.resolve()
  await sleep()
  expect(progress.value).toEqual({ curr: 1, total: 2 })

  // A rough guess before the channel says how many collectors it has...
  channel.progress(1, 2)
  expect(progress.value.curr).toBe(1.5)
  // ...then the real total, which would otherwise walk the bar back to 1.1
  channel.progress(1, 10)
  expect(progress.value).toEqual({ curr: 1.5, total: 2 })

  channel.progress(8, 10)
  expect(progress.value.curr).toBeCloseTo(1.8)

  channel.resolve()
  await navigation
  expect(progress.value).toEqual({ curr: 2, total: 2 })
})

test('an aborted navigation leaves the route we are on alone', async () => {
  const meeting = deferred('meeting/1')
  const meetingRoute = route(record(meeting.factory))
  const first = startNavigation(meetingRoute, FROM)
  await sleep()
  meeting.resolve()
  await first
  landed(meetingRoute)

  // Heading somewhere else, then the navigation fails
  const other = deferred('other')
  const second = startNavigation(route(record(other.factory)), FROM)
  await sleep()
  other.resolve()
  await second
  abortNavigation()

  expect(other.release).toHaveBeenCalled()
  expect(meeting.release).not.toHaveBeenCalled()
  expect(steps.value.total).toBe(0)
})

test('a cancelled navigation leaves the one that replaced it alone', async () => {
  // Clicking a second meeting while the first is still loading: the router
  // reports the first as cancelled, but only once the second is under way
  const home = deferred('meeting-list', { held: false })
  const homeRoute = route(record(home.factory))
  const initial = startNavigation(homeRoute, FROM)
  await sleep()
  home.resolve()
  await initial
  landed(homeRoute)

  const first = deferred('meeting/1')
  const abandoned = route(record(first.factory))
  const goneFor = startNavigation(abandoned, FROM)
  await sleep()

  const second = deferred('meeting/2')
  const wanted = route(record(second.factory))
  const navigation = startNavigation(wanted, FROM)
  await sleep()

  // The abandoned one settles late and is reported as cancelled
  first.resolve()
  await goneFor
  abortNavigation(abandoned)

  // Nothing is given back on its say-so: what's held is the pending
  // navigation's now, and releasing against the route we're leaving would drop
  // the channel that one has just taken
  expect(first.release).not.toHaveBeenCalled()
  expect(second.release).not.toHaveBeenCalled()

  second.resolve()
  await navigation
  landed(wanted)

  // Landing is what lets the abandoned one go, and what keeps ours
  expect(first.release).toHaveBeenCalledTimes(1)
  expect(second.release).not.toHaveBeenCalled()

  // Still in hand: coming back to it must not subscribe a second time
  const again = startNavigation(route(record(second.factory)), FROM)
  await sleep()
  expect(second.started).toHaveBeenCalledTimes(1)
  await again

  const elsewhere = route(record())
  await startNavigation(elsewhere, FROM)
  landed(elsewhere)
  expect(second.release).toHaveBeenCalledTimes(1)
})

test('settles on the route we landed on, not the one we asked for', async () => {
  const meeting = deferred('meeting/1')
  const meetingRoute = route(record(meeting.factory))
  const first = startNavigation(meetingRoute, FROM)
  await sleep()
  meeting.resolve()
  await first
  landed(meetingRoute)

  // A navigation whose requirements ran, but which ended up somewhere else -
  // the router settled on a route we never collected for
  const list = deferred('meeting-list', { held: false })
  const asked = route(record(list.factory))
  const navigation = startNavigation(asked, FROM)
  await sleep()
  list.resolve()
  await navigation

  landed(route(record()))
  // Keys are taken from where we are, so the meeting isn't kept on the
  // strength of a navigation that didn't happen
  expect(meeting.release).toHaveBeenCalled()
  expect(steps.value.total).toBe(0)
})

test('settling twice is harmless', async () => {
  // afterEach and the currentRoute watcher both settle; whichever is first
  // does the work, and the other must not release what the new route needs
  const meeting = deferred('meeting/1')
  const meetingRoute = route(record(meeting.factory))
  const navigation = startNavigation(meetingRoute, FROM)
  await sleep()
  meeting.resolve()
  await navigation

  landed(meetingRoute)
  landed(meetingRoute)
  landed(route(record()))

  expect(meeting.release).not.toHaveBeenCalled()
  expect(steps.value.total).toBe(0)
})

test('a background requirement does not hold the navigation', async () => {
  const channel = deferred('agenda_item/5', { blocking: false })
  const navigation = startNavigation(route(record(channel.factory)), FROM)

  // Through before the channel has delivered anything - the view is mounted
  // and showing its own spinner while this finishes
  await expect(navigation).resolves.toBeUndefined()
  expect(channel.started).toHaveBeenCalled()
  // Nobody is waiting, so there's nothing for the bar to say
  expect(steps.value).toEqual({ done: 0, total: 0 })

  channel.resolve()
  await sleep()
})

test('a background requirement is still held and released', async () => {
  const channel = deferred('agenda_item/5', { blocking: false })
  const first = route(record(channel.factory))
  await startNavigation(first, FROM)
  channel.resolve()
  await sleep()
  landed(first)
  expect(channel.release).not.toHaveBeenCalled()

  const elsewhere = route(record())
  await startNavigation(elsewhere, FROM)
  landed(elsewhere)
  expect(channel.release).toHaveBeenCalledTimes(1)
})

test("background work waits for its own record's blocking work", async () => {
  // The room routes ask for the meeting and the room in one record: there's no
  // point subscribing to the room before we know the meeting is ours
  const meeting = deferred('meeting/1')
  const room = deferred('room/3', { blocking: false })
  const navigation = startNavigation(
    route(record(meeting.factory, room.factory)),
    FROM
  )
  await sleep()

  expect(room.started).not.toHaveBeenCalled()
  // Only the blocking one is counted, and only it is waited for
  expect(steps.value).toEqual({ done: 0, total: 1 })

  meeting.resolve()
  await expect(navigation).resolves.toBeUndefined()
  await sleep()
  expect(room.started).toHaveBeenCalled()
  expect(steps.value).toEqual({ done: 1, total: 1 })
})

test('a record with nothing blocking starts its work at once', async () => {
  // Switching agenda items: the meeting is already held, so nothing in the
  // record blocks and the channel goes out without waiting on anything
  const item = deferred('agenda_item/5', { blocking: false })
  const navigation = startNavigation(route(record(item.factory)), FROM)
  await navigation
  expect(item.started).toHaveBeenCalled()
  item.resolve()
  await sleep()
})

test("a child's background work waits for its parent to be met", async () => {
  const meeting = deferred('meeting/1')
  const item = deferred('agenda_item/5', { blocking: false })
  const navigation = startNavigation(
    route(record(meeting.factory), record(item.factory)),
    FROM
  )
  await sleep()

  // No point subscribing to an agenda item before we know the meeting is ours
  expect(item.started).not.toHaveBeenCalled()

  meeting.resolve()
  await navigation
  await sleep()
  expect(item.started).toHaveBeenCalled()
})

test('the first navigation waits for everything', async () => {
  const meeting = deferred('meeting/1')
  const item = deferred('agenda_item/5', { blocking: false })
  const navigation = startNavigation(
    route(record(meeting.factory), record(item.factory)),
    // Coming from nowhere: the splash is up, so waiting costs nothing and the
    // first page is worth having whole
    START_LOCATION
  )
  await sleep()
  expect(steps.value).toEqual({ done: 0, total: 2 })

  meeting.resolve()
  await sleep()
  expect(item.started).toHaveBeenCalled()

  let done = false
  navigation.then(() => (done = true))
  await sleep()
  expect(done).toBe(false) // still waiting on the agenda item

  item.resolve()
  await navigation
  expect(steps.value).toEqual({ done: 2, total: 2 })
})

test('a background redirect is dropped rather than thrown', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const stray = deferred('stray', { blocking: false })
  await startNavigation(route(record(stray.factory)), FROM)

  stray.resolve({ name: 'home' })
  await sleep()
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('stray'))
  // Whatever it took goes back - we're not going where it wanted
  expect(stray.release).toHaveBeenCalled()
  warn.mockRestore()
})

test('a background failure is reported, not thrown at the guard', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const failing = deferred('failing', { blocking: false })
  await expect(
    startNavigation(route(record(failing.factory)), FROM)
  ).resolves.toBeUndefined()

  failing.reject(new Error('nope'))
  await sleep()
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining('failing'),
    expect.any(Error)
  )
  warn.mockRestore()
})

test('the boot fetches are one step, and drop out once the app is up', async () => {
  const reportBoot = trackBoot()
  // Not on the board on its own: the boot starts before the router, and a
  // total of 1 here would grow the moment the route's requirements are known
  expect(steps.value).toEqual({ done: 0, total: 0 })
  reportBoot(1, 4)
  expect(steps.value).toEqual({ done: 0, total: 0 })

  // The first navigation counts it alongside its own requirements, progress
  // and all
  const meeting = deferred('meeting/1')
  const home = route(record(meeting.factory))
  const navigation = startNavigation(home, FROM)
  await sleep()
  expect(steps.value).toEqual({ done: 0, total: 2 })
  expect(progress.value).toEqual({ curr: 0.25, total: 2 })

  // Sub-progress moves the bar without the step counting as done
  reportBoot(3, 4)
  expect(steps.value).toEqual({ done: 0, total: 2 })
  reportBoot(4, 4)
  expect(steps.value).toEqual({ done: 1, total: 2 })

  meeting.resolve()
  await navigation
  expect(steps.value).toEqual({ done: 2, total: 2 })

  // Gone for good once we've landed - later navigations count only their own
  landed(home)
  const later = deferred('agenda_item/5')
  const next = route(record(later.factory))
  startNavigation(next, FROM)
  await sleep()
  expect(steps.value).toEqual({ done: 0, total: 1 })

  reportBoot(1, 4) // a stale report can't put it back
  expect(steps.value).toEqual({ done: 0, total: 1 })
  later.resolve()
  await sleep()
})

test('requirements are counted before the gate they wait behind opens', async () => {
  // Boot is what the gate stands for: the count has to be whole from the first
  // frame, or the bar's total moves under it when the fetches land
  let openGate: () => void = () => {}
  const gate = new Promise<void>((resolve) => (openGate = resolve))

  const reportBoot = trackBoot()
  const meeting = deferred('meeting/1')
  const item = deferred('agenda_item/5')
  const navigation = startNavigation(
    route(record(meeting.factory), record(item.factory)),
    START_LOCATION,
    gate
  )
  await sleep()

  // Everything is on the board, and nothing has started
  expect(steps.value).toEqual({ done: 0, total: 3 })
  expect(meeting.started).not.toHaveBeenCalled()

  reportBoot(4, 4)
  expect(steps.value).toEqual({ done: 1, total: 3 })

  openGate()
  await sleep()
  expect(meeting.started).toHaveBeenCalled()
  expect(steps.value.total).toBe(3)

  meeting.resolve()
  await sleep()
  item.resolve()
  await navigation
  expect(steps.value).toEqual({ done: 3, total: 3 })
})
