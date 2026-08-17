import { expect, test, vi } from 'vitest'
import { computed, effect } from 'vue'

import type { AllTagsPayload, TagChangedPayload } from './types'
// Importing the module registers the 'ptags' content type as a side effect
import useParticipantTags from './useParticipantTags'

const { mockAddTypeHandler } = vi.hoisted(() => ({
  mockAddTypeHandler: vi.fn()
}))

vi.mock('@/utils/Socket', () => ({
  socket: { addTypeHandler: mockAddTypeHandler }
}))
// ContentType -> useContextRoles -> useAuthStore -> organisations/contentTypes -> ContentType
// is a circular import; mocking these two breaks the cycle, as in ContentType.test.ts
vi.mock('@/composables/useContextRoles', () => ({
  default: () => ({ set: vi.fn() })
}))
vi.mock('@/modules/organisations/useUserDetails', () => ({
  default: () => ({ setUser: vi.fn() })
}))

// Other content types are registered by transitive imports, so find ours by name
const socketHandler = mockAddTypeHandler.mock.calls.find(
  ([name]) => name === 'ptags'
)![1] as (msg: { t: string; p: AllTagsPayload | TagChangedPayload }) => void

const MEETING = 42

test('"all" payload populates tags per user', () => {
  const { getUserTags, getTagUsers } = useParticipantTags(MEETING)
  socketHandler({
    t: 'ptags.all',
    p: { meeting: MEETING, tags: { 'group:a': [1, 2], 'group:b': [2] } }
  })
  expect(getUserTags(1)).toEqual(['group:a'])
  expect(getUserTags(2)).toEqual(['group:a', 'group:b'])
  expect([...getTagUsers('group:b')]).toEqual([2])
})

test('"changed" payload invalidates effects reading an existing meeting store', () => {
  const meeting = MEETING + 1
  const { getUserTags } = useParticipantTags(meeting)

  // Populate first, so the inner Map already exists when the change arrives.
  // Under a naive shallow swap the inner Map would be raw and this would not re-run.
  socketHandler({
    t: 'ptags.all',
    p: { meeting, tags: { 'group:a': [7] } }
  })

  const userTags = computed(() => getUserTags(7))
  let runs = 0
  effect(() => {
    runs++
    userTags.value
  })
  expect(userTags.value).toEqual(['group:a'])
  expect(runs).toBe(1)

  socketHandler({
    t: 'ptags.changed',
    p: { meeting, user: 7, tags: { group: ['b', 'c'] } }
  })
  expect(userTags.value).toEqual(['group:b', 'group:c'])
  expect(runs).toBe(2)
})

test('getUserTags filters on namespace', () => {
  const meeting = MEETING + 2
  const { getUserTags } = useParticipantTags(meeting)
  socketHandler({
    t: 'ptags.changed',
    p: { meeting, user: 3, tags: { group: ['a'], role: 'chair' } }
  })
  expect(getUserTags(3)).toEqual(['group:a', 'role:chair'])
  expect(getUserTags(3, 'role')).toEqual(['role:chair'])
  expect(getUserTags(3, 'missing')).toEqual([])
})
