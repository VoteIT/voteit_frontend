import type { Vote } from '@/contentTypes/types'

/**
 * The vote's content was removed after the meeting. The vote still counts as
 * cast, but there's nothing left to show.
 */
export function isClearedVote(vote: Vote) {
  return vote.vote === null && !vote.abstain
}
