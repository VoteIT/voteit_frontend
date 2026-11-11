import { nextTick, shallowRef } from 'vue'
import { beforeEach, expect, test, vi } from 'vitest'

const updateOrganisation = vi.hoisted(() => vi.fn())

vi.mock('./useOrgStore', () => ({
  default: () => ({
    get organisation() {
      return org.value
    },
    updateOrganisation
  })
}))

import useVoteRetention from './useVoteRetention'

const org = shallowRef<object>()

beforeEach(() => {
  org.value = { pk: 1, vote_retention_days: 90, auto_clear_votes: false }
  updateOrganisation.mockReset()
})

test('starts from saved values and tracks changes', async () => {
  const { changed, days, save } = useVoteRetention()
  expect(days.value).toBe(90)
  expect(changed.value).toBe(false)

  days.value = 30
  expect(changed.value).toBe(true)
  await save()
  expect(updateOrganisation).toHaveBeenCalledWith({
    auto_clear_votes: false,
    vote_retention_days: 30
  })
})

test('asks for confirmation when saving may remove votes', () => {
  const { autoClear, days, needsConfirm } = useVoteRetention()
  days.value = 30
  expect(needsConfirm.value).toBe(false) // Auto clear off

  autoClear.value = true
  expect(needsConfirm.value).toBe(true) // Turning it on

  org.value = { pk: 1, vote_retention_days: 90, auto_clear_votes: true }
  expect(needsConfirm.value).toBe(true) // Shorter period while on

  days.value = 120
  expect(needsConfirm.value).toBe(false) // Longer period while on
})

test('follows saved values', async () => {
  const { autoClear, days } = useVoteRetention()
  org.value = { pk: 1, vote_retention_days: 60, auto_clear_votes: true }
  await nextTick()
  expect(days.value).toBe(60)
  expect(autoClear.value).toBe(true)
})
