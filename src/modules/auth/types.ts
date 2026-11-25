import type { MeetingState } from '../meetings/types'

export interface IDjangoMessage {
  level: number
  level_tag: 'debug' | 'info' | 'success' | 'warning' | 'error'
  message: string
  tags: string
}

/** Answer meaning "none of these, give me a new account". */
export const LINK_ACCOUNT_NEW = 'new'

/** An account a paused login could be claiming. */
export interface LinkAccountCandidate {
  readonly pk: number
  readonly name: string
  readonly email: string
  readonly last_login: string | null
  readonly meetings: string[]
}

/**
 * What a paused login is asking about. The token stands in for a session -
 * nobody is signed in while the question is open - and is spent on answering.
 */
export interface AccountLinkOptions {
  readonly provider: string
  /** Where the answer goes, on the backend, to pick the login up again. */
  readonly resume_url: string
  readonly accounts: LinkAccountCandidate[]
}

/** A meeting an account takes part in, upcoming or ongoing. */
export interface IdentityAccountMeeting {
  readonly pk: number
  readonly title: string
  readonly state: MeetingState
}

/** A meeting in an account's meeting list. */
export interface AccountMeeting {
  readonly pk: number
  readonly title?: string
  /** Unknown for an invited meeting the server didn't list */
  readonly state?: MeetingState
}

/** One of several accounts a single id proxy identity reaches. */
export interface IdentityAccount {
  readonly pk: number
  readonly name: string
  readonly userid: string | null
  readonly email: string
  readonly last_login: string | null
  readonly meetings: IdentityAccountMeeting[]
}

/**
 * What a login paused on several accounts is asking about. Like
 * AccountLinkOptions, the token stands in for a session.
 */
export interface IdentityAccountOptions {
  readonly provider: string
  readonly resume_url: string
  /** False when the server would refuse a merge, see merge_blocked_reason. */
  readonly can_merge: boolean
  readonly merge_blocked_reason: string | null
  readonly accounts: IdentityAccount[]
}
