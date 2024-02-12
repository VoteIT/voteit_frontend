/* eslint-disable camelcase */

import type { PollMethodSettings } from '../polls/methods/types'
import type { PollPlugin } from '../polls/registry'

export interface QuickStartMethod extends PollPlugin {
  settings: PollMethodSettings | null
  title: string
}
