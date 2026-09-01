import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'

import type { ProgressHandler } from '@/utils/types'

/**
 * One thing a route needs in place before it may be shown.
 *
 * Requirements are produced by a route's `meta.load` and run by the navigation
 * guard, so the work starts before anything is mounted - and a requirement that
 * can't be met redirects instead of letting a view render half loaded.
 */
export interface Requirement {
  /**
   * Stable identity, e.g. `channel:participants/12`. Deduplicates within a
   * navigation and diffs the held requirements across navigations, so the same
   * key is never loaded twice at once.
   */
  key: string
  /**
   * Hold the navigation until this is met, rather than letting it through and
   * loading behind it. Off by default.
   *
   * Worth it only where the page is no use without it, or where the answer
   * decides whether we should be on this route at all - a redirect is the one
   * thing that can't be done after the view is mounted. For anything a view
   * can show up without, blocking just makes the app feel slow: switching
   * agenda items would hold the old page for a round trip to replace part of
   * the new one, which the view says better with a spinner.
   *
   * The first navigation ignores this and waits for everything. Nothing is on
   * screen yet but the splash, so there's nothing there to feel slow, and the
   * app's first page is worth having whole.
   */
  blocking?: boolean
  /**
   * Do the work. `report` drives the progress bar; a requirement that can't say
   * how far it has got simply never calls it. Only a blocking requirement is
   * reported - nobody is waiting on the rest.
   *
   * Resolving to a route redirects there, cancelling what's left of the
   * navigation. Throwing fails the navigation. Both need `blocking`: a
   * navigation that has already happened can't be called off, so a background
   * requirement's redirect is dropped with a warning and a failure is logged.
   */
  load(report: ProgressHandler): Promise<void | RouteLocationRaw>
  /**
   * Give up whatever `load` took hold of - a channel subscription, typically.
   * Called once the current route no longer requires this key.
   *
   * Its presence is what marks a requirement as *held*: a held key is skipped
   * while it's still in hand, where a requirement without `release` is a
   * one-shot fetch that runs on every navigation that asks for it.
   */
  release?(): void
}

/**
 * Turns a route into the requirements it brings. Returning nothing means this
 * route has nothing to load - typically because the param it works from isn't
 * there.
 *
 * Called before the boot fetches have settled, so decide from the route alone:
 * a factory that consults fetched state - who's signed in, what's in a store -
 * would produce a requirement only once that arrived, and the progress bar's
 * total would shift under it. Anything of that kind belongs in `load`, which
 * runs after. Producing the requirement and having it do nothing is fine.
 */
export type RequirementFactory = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
) => Requirement | Requirement[] | undefined | void

declare module 'vue-router' {
  interface RouteMeta {
    /**
     * What must be loaded before this route is shown. Collected from every
     * matched record, parent first.
     */
    load?: RequirementFactory | RequirementFactory[]
  }
}
