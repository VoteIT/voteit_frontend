/* eslint-disable camelcase */

import { PollMethod, PollMethodSettings } from '../polls/methods/types'

export interface QuickStartMethod {
  method: PollMethod,
  proposalsMin: number
  settings: PollMethodSettings | null
  title: string,
}
