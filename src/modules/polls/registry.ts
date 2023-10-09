import type { Dictionary } from 'lodash'
import type { Component } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'

import type { SchemaGenerator } from '@/components/inputs/types'
import type { OrganisationPlugin } from '../organisations/PluginHandler'
import type { PollMethodCriterion, PollMethodSettings } from './methods/types'
import PluginHandler from '../organisations/PluginHandler'

export interface PollPlugin extends OrganisationPlugin {
  criterion: PollMethodCriterion
  discouraged?: boolean
  getDescription (t: ComposerTranslation): string
  getHelp (t: ComposerTranslation): string
  getName (t: ComposerTranslation): string
  getSchema?: SchemaGenerator
  initialSettings?: PollMethodSettings
  multipleWinners?: boolean
  proposalsMax?: number
  proposalsMin: number
  resultComponent: Component
  voteComponent: Component
}

const LEGACY_POLL_NAMES: Dictionary<string> = {
  schulze_pr: 'Schulze PR',
  schulze_stv: 'Schulze STV'
}

function getLegacyName (method: string, t: ComposerTranslation) {
  if (!(method in LEGACY_POLL_NAMES)) throw new Error(`Unknown poll method: ${method}`)
  return `${LEGACY_POLL_NAMES[method]} (${t('poll.method.legacy')})`
}

class PollPluginHandler extends PluginHandler<PollPlugin> {
  public getAvailableMethods (proposalCount: number) {
    // Get poll methods available for number of proposals
    return this.getActivePlugins(({ proposalsMax, proposalsMin }) => proposalCount >= proposalsMin && (!proposalsMax || proposalCount <= proposalsMax))
  }

  public getName (method: string, t: ComposerTranslation): string {
    const plugin = this.getPlugin(method)
    return plugin
      ? plugin.getName(t)
      : getLegacyName(method, t)
  }
}

export const pollPlugins = new PollPluginHandler()
