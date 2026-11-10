import { describe, expect, test, vi } from 'vitest'

import { ApiError, NetworkError } from '@/utils/restApi'

import { getInvalidVoteDetail, getVoteErrorKind } from './voteErrors'

function apiError(status: number, data: unknown = {}) {
  return new ApiError(status, data, new Headers(), `HTTP ${status}`)
}

describe('getVoteErrorKind', () => {
  test.each([
    [apiError(504), 'timeout'],
    [apiError(408), 'timeout'],
    [apiError(500), 'server'],
    [apiError(502), 'server'],
    [apiError(403), 'rejected'],
    [apiError(400), 'rejected'],
    [new NetworkError(), 'network']
  ])('%s → %s', (error, kind) => {
    expect(getVoteErrorKind(error)).toBe(kind)
  })

  test('logs and retries on errors that are not failed requests', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const bug = new TypeError('oops')
    expect(getVoteErrorKind(bug)).toBe('server')
    expect(spy).toHaveBeenCalledWith(bug)
    spy.mockRestore()
  })
})

describe('getInvalidVoteDetail', () => {
  test('returns the vote field errors of a 400', () => {
    expect(
      getInvalidVoteDetail(apiError(400, { vote: ['Too many', 'Bad'] }))
    ).toBe('Too many\nBad')
  })

  test('falls back to non_field_errors', () => {
    expect(getInvalidVoteDetail(apiError(400, ['Nope']))).toBe('Nope')
  })

  test('nothing for other statuses or empty bodies', () => {
    expect(getInvalidVoteDetail(apiError(403, { vote: ['x'] }))).toBeUndefined()
    expect(getInvalidVoteDetail(apiError(400, {}))).toBeUndefined()
    expect(getInvalidVoteDetail(new NetworkError())).toBeUndefined()
  })
})
