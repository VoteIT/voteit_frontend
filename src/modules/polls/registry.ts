import type { Dictionary } from 'lodash'
import type { Component, DefineComponent } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'

import PluginHandler, {
  OrganisationPlugin
} from '../organisations/PluginHandler'
import type { PollMethodCriterion, PollMethodSettings } from './methods/types'

type SettingsComponent<T> = DefineComponent<
  {
    modelValue: T
    proposals: number
  },
  {},
  any,
  {},
  {},
  {},
  {},
  {
    'update:modelValue': (value: T) => void
  }
>

export interface PollPlugin extends OrganisationPlugin {
  criterion: PollMethodCriterion
  discouraged?: boolean
  getDefaultSettings?(proposals: number): PollMethodSettings
  getDescription(t: ComposerTranslation): string
  getHelp(t: ComposerTranslation): string
  getName(t: ComposerTranslation): string
  multipleWinners?: boolean
  proposalsMax?: number
  proposalsMin: number
  resultComponent: Component
  settingsComponent?: SettingsComponent<PollMethodSettings>
  voteComponent: Component
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
