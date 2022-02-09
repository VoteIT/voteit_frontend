/* eslint-disable camelcase */

// Don't bother translating for now - only Swedish
export enum MeetingFunction {
  Talarlistor = 'speakers',
  Annat = 'other'
}

export interface BugReport {
  readonly pk: number
  readonly user: number
  readonly user_roles: string[]
  meeting: number
  user_platform: Record<string, string>
  function: MeetingFunction
  description: string
}
