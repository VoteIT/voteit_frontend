import { Component } from 'vue'

import { SchemaGenerator } from '@/components/inputs/types'
import PluginHandler, { OrganisationPlugin } from '../organisations/PluginHandler'
import { PollMethodCriterion, PollMethodSettings } from './methods/types'
import { ComposerTranslation } from 'vue-i18n'

export interface PollPlugin extends OrganisationPlugin {
  criterion: PollMethodCriterion
  discouraged?: boolean
  getName (t: ComposerTranslation): string
  getSchema?: SchemaGenerator
  initialSettings?: PollMethodSettings
  multipleWinners?: boolean
  proposalsMax?: number
  proposalsMin: number
  resultComponent: Component
  voteComponent: Component
}

class PollPluginHandler extends PluginHandler<PollPlugin> {
  public getAvailableMethods (proposalCount: number) {
    // Get poll methods available for number of proposals
    return this.getActivePlugins(({ proposalsMax, proposalsMin }) => proposalCount >= proposalsMin && (!proposalsMax || proposalCount <= proposalsMax))
  }
}

export const pollPlugins = new PollPluginHandler()
