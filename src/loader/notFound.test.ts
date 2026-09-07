import { expect, test } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'

import { notFoundRequirement, notFoundRoute } from './notFound'

const route = (path: string) =>
  ({ path, query: {}, hash: '' }) as unknown as RouteLocationNormalized

test('keeps the address the user typed', () => {
  // The path is one a real route matches - that is how a requirement came to
  // be asked for it at all - so the record is named and the path handed to it
  // as the `pathMatch` the 404 route is declared with.
  expect(notFoundRoute(route('/m/0/abc'))).toEqual({
    name: '404',
    params: { pathMatch: ['m', '0', 'abc'] },
    query: {},
    hash: ''
  })
})

test('is a blocking requirement that holds nothing', async () => {
  const requirement = notFoundRequirement(route('/m/abc/def'))
  // A redirect can't be issued once the view is mounted, and a requirement
  // that held something would be skipped the next time it was asked for.
  expect(requirement.blocking).toBe(true)
  expect(requirement.release).toBeUndefined()
  expect(await requirement.load(() => {})).toMatchObject({ name: '404' })
})
