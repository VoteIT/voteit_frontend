import { ComposerTranslation } from 'vue-i18n'

import { isApiError, NetworkError, parseRestError } from '@/utils/restApi'

/**
 * - timeout: the server (or the proxy in front of it) gave up waiting
 * - network: no response at all
 * - server: the server failed; trying again may work
 * - rejected: the server refused the vote; trying again won't help
 */
export type VoteErrorKind = 'timeout' | 'network' | 'server' | 'rejected'

const TIMEOUT_STATUSES = [408, 504]

export function getVoteErrorKind(e: unknown): VoteErrorKind {
  if (e instanceof NetworkError) return 'network'
  if (!isApiError(e)) {
    // Not a failed request, so a bug. Still let the voter try again.
    console.error(e)
    return 'server'
  }
  if (TIMEOUT_STATUSES.includes(e.status)) return 'timeout'
  if (e.status >= 500) return 'server'
  return 'rejected'
}

/**
 * The server's explanation for an invalid vote (HTTP 400), if it gave one.
 */
export function getInvalidVoteDetail(e: unknown): string | undefined {
  if (!isApiError(e) || e.status !== 400) return
  const errors = parseRestError<{ vote: string[] }>(e)
  const msgs = errors.vote ?? errors.non_field_errors
  return msgs?.length ? msgs.join('\n') : undefined
}

/**
 * Keys spelled out in full, so extractLocales can find them.
 */
export function translateVoteError(
  kind: VoteErrorKind,
  t: ComposerTranslation
): string {
  switch (kind) {
    case 'timeout':
      return t('poll.voteError.timeout')
    case 'network':
      return t('poll.voteError.network')
    case 'server':
      return t('poll.voteError.server')
    case 'rejected':
      return t('poll.voteError.rejected')
  }
  throw new Error(`Unknown vote error kind ${kind}`)
}
