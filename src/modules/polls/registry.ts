import type { Dictionary } from 'lodash'
import type { Component } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'

import { VModelComponent } from '@/utils/types'
import PluginHandler, {
  OrganisationPlugin
} from '../organisations/PluginHandler'
import type { PollMethodCriterion } from './methods/types'
import { Poll } from './types'
import { Proposal } from '../proposals/types'

export interface PollPlugin<T extends Poll = any, TVote extends {} = any>
  extends OrganisationPlugin {
  criterion: PollMethodCriterion
  discouraged?: boolean
  getDefaultSettings?(proposals: number): T['settings']
  getDescription(t: ComposerTranslation): string
  getHelp(t: ComposerTranslation): string
  getSelectionRange?(settings: T['settings']): {
    min: number
    max: number | null
  } // For ranked or approval polls
  getName(t: ComposerTranslation): string
  multipleWinners?: boolean
  proposalsMax?: number
  proposalsMin: number
  resultComponent: Component
  settingsComponent?: VModelComponent<T['settings'], { proposals: number }>
  voteComponent: VModelComponent<
    TVote,
    {
      disabled?: boolean
      modelValue?: TVote
      poll: Poll
      proposals: Proposal[]
    }
  >
}

const LEGACY_POLL_NAMES: Dictionary<string> = {
  schulze_pr: 'Schulze PR',
  schulze_stv: 'Schulze STV'
}

function getLegacyName(method: string, t: ComposerTranslation) {
  if (!(method in LEGACY_POLL_NAMES))
    throw new Error(`Unknown poll method: ${method}`)
  return `${LEGACY_POLL_NAMES[method]} (${t('poll.method.legacy')})`
}

class PollPluginHandler extends PluginHandler<PollPlugin> {
  public getAvailableMethods(proposalCount: number) {
    // Get poll methods available for number of proposals
    return this.getActivePlugins(
      ({ proposalsMax, proposalsMin }) =>
        proposalCount >= proposalsMin &&
        (!proposalsMax || proposalCount <= proposalsMax)
    )
  }

  public getName(method: string, t: ComposerTranslation): string {
    const plugin = this.getPlugin(method)
    return plugin ? plugin.getName(t) : getLegacyName(method, t)
  }
}

export const pollPlugins = new PollPluginHandler()
