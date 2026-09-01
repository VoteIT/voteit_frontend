import { imap, sum } from 'itertools'
import { computed, shallowReactive, shallowRef } from 'vue'
import { START_LOCATION } from 'vue-router'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'

import type { Requirement, RequirementFactory } from './types'

/**
 * Requirements that took hold of something and haven't given it back, keyed by
 * requirement key. Held across navigations, so moving between two routes that
 * need the same channel doesn't drop and retake the subscription.
 */
const held = new Map<string, Requirement>()

/** What the route we're actually on requires. Anything else held is let go. */
let activeKeys = new Set<string>()

/** What the pending navigation requires, held keys included. */
let pendingKeys = new Set<string>()

/** Full path of the navigation whose requirements we ran. */
let pendingPath: string | undefined

/**
 * Bumped whenever a navigation starts, so one that has been superseded can
 * neither redirect nor report progress. Same idiom as `useChannel`.
 */
let generation = 0

/** How far each requirement of the pending navigation has got, 0..1. */
const fractions = shallowReactive(new Map<string, number>())

/**
 * The boot fetches get an entry here too, alongside the first navigation's
 * requirements. One step rather than one each: they run together and are
 * quick, so counting them separately would say more about the loader than
 * about the wait. It drops out with the rest once the app has its first page.
 */
const BOOT_KEY = 'app-boot'

/**
 * How far the boot has got, kept aside until the first navigation collects.
 * The boot starts before the router does, and putting it on the board on its
 * own would mean a total that grows the moment the route's own requirements
 * are known - which is exactly the twitch the count is there to avoid.
 * Undefined once the app has its first page.
 */
let bootFraction: number | undefined

/**
 * Start counting the boot fetches as a step.
 * @returns a reporter, shaped like the one a `Requirement` is handed
 */
export function trackBoot() {
  bootFraction = 0
  return (curr: number, total: number) => {
    // Gone once the app is up; the boot doesn't come round again
    if (bootFraction === undefined) return
    bootFraction = Math.min(curr / total, 1)
    if (fractions.has(BOOT_KEY)) fractions.set(BOOT_KEY, bootFraction)
  }
}

/**
 * Where we're heading, while a navigation is waiting on its requirements. Its
 * presence is also what marks a navigation as unsettled, so settling twice is
 * harmless.
 */
export const pendingRoute = shallowRef<RouteLocationNormalized>()

/**
 * Requirement progress, normalised: every requirement counts for one, however
 * many collectors it turns out to have. Summing raw totals instead would grow
 * the denominator when a channel finally announces its collectors, walking the
 * bar backwards.
 */
export const progress = computed(() => ({
  curr: sum(fractions.values()),
  total: fractions.size
}))

/** Requirements finished out of requirements to do - the "2 / 5" in the UI. */
export const steps = computed(() => ({
  done: sum(imap(fractions.values(), (fraction) => (fraction === 1 ? 1 : 0))),
  total: fractions.size
}))

function toArray<T>(value: T | T[] | undefined | void): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

/**
 * The requirements of every matched record, parent first, grouped by record.
 *
 * Grouping is what orders the work: a group runs in parallel, groups run in
 * sequence, so a child's requirements only start once its parent's are met -
 * an agenda item channel is not worth subscribing before we know the meeting
 * is ours.
 */
export function collect(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
) {
  const groups: Requirement[][] = []
  const keys = new Set<string>()
  for (const record of to.matched) {
    const group: Requirement[] = []
    for (const factory of toArray<RequirementFactory>(record.meta.load)) {
      for (const requirement of toArray(factory(to, from))) {
        if (keys.has(requirement.key)) continue
        keys.add(requirement.key)
        // Already in hand from an earlier navigation - taking it again would
        // just be a second subscription to the same channel. A requirement
        // without `release` holds nothing, so it runs every time it's asked
        // for.
        if (held.has(requirement.key)) continue
        group.push(requirement)
      }
    }
    if (group.length) groups.push(group)
  }
  return { groups, keys }
}

async function runOne(
  requirement: Requirement,
  current: number,
  /** Whether the navigation is waiting on this, and the bar showing it */
  awaited: boolean
) {
  // Registered before awaiting, so a navigation that fails or is abandoned
  // mid-flight still finds this to release.
  if (requirement.release) held.set(requirement.key, requirement)
  const result = await requirement.load(({ curr, total }) => {
    if (!awaited || current !== generation || !total) return
    // Never backwards. A channel only announces its collectors once it's
    // subscribed, so a requirement that reported a rough total first would
    // otherwise walk the bar back when the real one arrives.
    const fraction = Math.min(curr / total, 1)
    const reported = fractions.get(requirement.key) ?? 0
    if (fraction > reported) fractions.set(requirement.key, fraction)
  })
  if (current !== generation) return result
  if (awaited) fractions.set(requirement.key, 1)
  if (result) {
    // Sending us elsewhere: give back what this took rather than holding it for
    // a route we aren't going to visit after all.
    held.delete(requirement.key)
    requirement.release?.()
  }
  return result
}

/**
 * Start a requirement the navigation isn't waiting for. Nobody is left to act
 * on what it returns, so a redirect it asks for is dropped and a failure is
 * only reported - neither can be allowed to reject into the guard, which by
 * then belongs to a navigation that has already happened.
 */
function runDetached(requirement: Requirement, current: number) {
  runOne(requirement, current, false).then(
    (redirect) => {
      if (redirect)
        console.warn(
          `Requirement '${requirement.key}' asked to redirect, but its ` +
            `navigation has already gone through. Mark it blocking to be ` +
            `able to redirect.`
        )
    },
    (error) => console.warn(`Requirement '${requirement.key}' failed`, error)
  )
}

/**
 * Load everything `to` needs. Resolves to a route when a requirement decided we
 * should be somewhere else, and rejects when one failed outright.
 *
 * A superseded navigation resolves to nothing: whatever it started is left for
 * the navigation that replaced it to keep or release.
 */
export async function startNavigation(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  /**
   * Waited for once the requirements are collected, before any of them run.
   * The boot fetches go here: collecting first means the count is whole from
   * the first frame, rather than the route's requirements appearing when boot
   * lands and shifting the total under the bar.
   */
  ready?: Promise<unknown>
): Promise<void | RouteLocationRaw> {
  const current = ++generation
  const { groups, keys } = collect(to, from)
  pendingKeys = keys
  pendingPath = to.fullPath
  pendingRoute.value = to

  // Nothing but the splash is on screen for the first navigation, so there is
  // nothing there to feel slow: it waits for everything, and the app's first
  // page arrives whole. After that only the requirements that say so are
  // waited for - see `Requirement.blocking`.
  const first = from === START_LOCATION
  const awaits = (requirement: Requirement) => first || !!requirement.blocking

  // Boot joins the board here, on the first navigation - the only entry in it
  // that isn't a requirement of the route
  fractions.clear()
  if (bootFraction !== undefined) fractions.set(BOOT_KEY, bootFraction)
  for (const group of groups)
    for (const requirement of group)
      if (awaits(requirement)) fractions.set(requirement.key, 0)

  if (ready) await ready
  if (current !== generation) return

  for (const group of groups) {
    const blocking = group.filter(awaits)
    if (blocking.length) {
      const results = await Promise.all(
        blocking.map((requirement) => runOne(requirement, current, true))
      )
      if (current !== generation) return
      const redirect = results.find((result): result is RouteLocationRaw =>
        Boolean(result)
      )
      if (redirect) return redirect
    }

    // Started once this record's own blocking work is met, so nothing
    // subscribes to content behind a door we haven't been let through yet -
    // the room routes ask for the meeting and the room together. A record with
    // nothing blocking, which is the common case, starts its work at once.
    for (const requirement of group)
      if (!awaits(requirement)) runDetached(requirement, current)
  }
}

/** Let go of everything held that the route we're on has no use for. */
function releaseUnmatched() {
  for (const [key, requirement] of held) {
    if (activeKeys.has(key)) continue
    held.delete(key)
    requirement.release?.()
  }
}

function clearPending() {
  pendingRoute.value = undefined
  pendingPath = undefined
  bootFraction = undefined
  fractions.clear()
}

/**
 * We've landed on `to`: what it requires is what we keep, and the rest goes
 * back.
 *
 * Idempotent, and takes the route it's given rather than trusting the pending
 * one, because two different signals call it - see the guards in ./index.ts.
 */
export function settleNavigation(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
) {
  if (!pendingRoute.value) return
  activeKeys =
    to.fullPath === pendingPath ? pendingKeys : collect(to, from).keys
  releaseUnmatched()
  clearPending()
}

/**
 * The navigation didn't happen - it failed, or a requirement sent us elsewhere.
 * We're still on the route we were on, so its requirements stand and anything
 * the abandoned navigation took is given back.
 *
 * Takes the route that failed, because a navigation the user clicked past
 * reports back *after* the one that replaced it has started: by then the
 * pending navigation is somebody else's, and releasing against the keys of the
 * route we're leaving would take away what the new one has just subscribed.
 * Called without a route it aborts whatever is pending, which is what the tests
 * and a caller with nothing to go on want.
 */
export function abortNavigation(to?: RouteLocationNormalized) {
  if (!pendingRoute.value) return
  if (to && to.fullPath !== pendingPath) return
  releaseUnmatched()
  clearPending()
}

/** Drop every held requirement. Tests only. */
export function reset() {
  activeKeys = new Set()
  pendingKeys = new Set()
  pendingRoute.value = undefined
  for (const [key, requirement] of held) {
    held.delete(key)
    requirement.release?.()
  }
  clearPending()
}
