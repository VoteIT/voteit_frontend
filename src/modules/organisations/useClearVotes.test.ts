import { beforeEach, expect, test, vi } from 'vitest'

vi.mock('@/utils/restApi', () => ({ default: { post: vi.fn() } }))

import restApi from '@/utils/restApi'

import useClearVotes from './useClearVotes'

const post = vi.mocked(restApi.post)

// Braces: a function returned from beforeEach runs as teardown, and mockReset returns the mock
beforeEach(() => {
  post.mockReset()
})

test('clears and keeps the result', async () => {
  const response = {
    cleared: 3,
    pending: [
      { meeting: 1, clearable_after: '2027-01-01T00:00:00Z', votes: 2 }
    ]
  }
  post.mockResolvedValue(response)
  const { clear, clearing, result } = useClearVotes()

  const promise = clear()
  expect(clearing.value).toBe(true)
  await promise

  expect(post).toHaveBeenCalledWith('votes/clear/')
  expect(result.value).toEqual(response)
  expect(clearing.value).toBe(false)
})

test('stops clearing when the request fails', async () => {
  post.mockRejectedValue(new Error('Nope'))
  const { clear, clearing, result } = useClearVotes()

  await expect(clear()).rejects.toThrow('Nope')
  expect(clearing.value).toBe(false)
  expect(result.value).toBeUndefined()
})
