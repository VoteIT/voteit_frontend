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
