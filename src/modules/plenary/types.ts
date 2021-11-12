/* eslint-disable camelcase */

import { PollMethod, PollMethodSettings } from '../polls/methods/types'

export interface QuickStartMethod {
  method: PollMethod,
  proposalsMin: number
  proposalsExact?: number
  settings: PollMethodSettings | null
  title: string,
}
