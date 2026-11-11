import { expect, test } from 'vitest'

import { isClearedVote } from './utils'

const base = { pk: 1, poll: 2 }

test('recognises cleared votes', () => {
  expect(isClearedVote({ ...base, abstain: false, vote: null })).toBe(true)
  expect(isClearedVote({ ...base, abstain: true, vote: null })).toBe(false)
  expect(isClearedVote({ ...base, abstain: false, vote: { approve: [] } })).toBe(
    false
  )
})
