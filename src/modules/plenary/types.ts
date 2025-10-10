import type { PollPlugin } from '../polls/registry'

export interface QuickStartMethod extends PollPlugin {
  settings: object | null
  title: string
}
