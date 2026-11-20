import type { ComposerTranslation } from 'vue-i18n'

import type { Poll } from '../polls/types'

export interface QuickStartMethod {
  getTitle(t: ComposerTranslation): string
  method: Poll['method_name']
  /** Overrides the poll method's own minimum */
  proposalsMin?: number
  settings: object | null
}
